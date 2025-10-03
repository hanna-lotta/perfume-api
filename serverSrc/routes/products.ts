import express from 'express';
import type { Request, Response, Router } from 'express';
import { PutCommand, DeleteCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage, GetResult } from '../data/types.js';
import { ProductSchema, productsPostSchema } from '../data/validation.js';
import { ProductIdParam } from '../data/types.js';

const router: Router = express.Router();

// GET - Hämtar alla produkter från DynamoDB
router.get("/", async (req: Request, res: Response<Product[] | ErrorMessage>) => { 
  try {
    // query command för att hämta alla items med Pk
    const command = new QueryCommand({
      TableName: myTable, // Tabellen i DynamoDB
      KeyConditionExpression: "Pk = :pk", // Filtrerar partition key
      ExpressionAttributeValues: {
        ":pk": "product"
      }
    });

    // Fråga DynamoDB efter alla items och får result
    const data = await db.send(command);

    // Mappa varje item för att kolla så att de är rätt datatyper
    const products: Product[] = (data.Items ?? []).map((item) => ({
        Pk: item.Pk,
        Sk: item.Sk,
        name: String(item.name),
        price: Number(item.price),
        img: String(item.img),
        amountInStock: Number(item.amountInStock),
    }))

    res.status(200).send(products); // Returnerar listan med produkter
  } catch (error) {
    console.error(error);
    // Felmeddelande
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get('/:productId', async (req: Request<ProductIdParam>, res: Response<Product | ErrorMessage>) => {
	const productId: string = req.params.productId
	
	try {
		let getCommand = new GetCommand({
			TableName: myTable,
			Key: {
				Pk: 'product',
				Sk: `p#${productId}`
			}
		})
		const result: GetResult = await db.send(getCommand)
		const item: Product | undefined | ErrorMessage = result.Item
		if (item) {
			res.status(200).send(item) // OK
		} else {
			res.status(404).send({ error: 'Product not found'}) // Not found
		}
	} catch (error) {
		console.error('Error fetching product:', error)
		res.status(500).send({ error: 'Failed to fetch product' }) // Server error
	}
})


// POST
router.post('/', async (req: Request , res: Response<Product | ErrorMessage>) => {
	const validation = productsPostSchema.safeParse(req.body)
	if (!validation.success) {
		res.status(400).send({ error: 'Invalid request body'}) //Bad request
		return
	}
  const productId: string = req.params.productId
  if (!productId) {
	res.status(400).send({error: 'productId is required'}) // Bad request
  	return
  }
  
  const { name, price, img, amountInStock } = validation.data
  const newItem: Product = {
	Pk: 'product',
	Sk: `p#${productId}`,
	name,
	price,
	img,
	amountInStock
  }
  
  try {
	await db.send(new PutCommand({
		TableName: myTable,
		Item: newItem
	}))
	res.status(201).send(newItem) // created
  } catch (error) {
	console.error('Error creating product:', error)
	res.status(500).send({ error: 'Failed to create product' }) // Server error
  }
});

// PUT
interface ProductPutBody
{name: string,
price: number,
amountInStock:number,
img:string
}

router.put(
  '/:productId',
  async ( req: Request<ProductIdParam,{}, ProductPutBody>,res: Response<Product | ErrorMessage>
  ) => {
    const bodyValidation = productsPostSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(400).send({ error: 'Invalid request body' });
      return;
    }

    const { productId } = req.params;
    if (!productId) {
      res.status(400).send({ error: 'productId is required' });
      return;
    }

    const { name, price, img, amountInStock } = bodyValidation.data;

    // Build the complete, canonical DB item
    const newItem: Product = {
      Pk: 'product',
      Sk: `p#${productId}`,
      name,
      price,
      img,
      amountInStock,
    };

    try {
      // Overwrite the item, but ONLY if it already exists (so PUT doesn’t create)
      await db.send(
        new PutCommand({
          TableName: myTable,
          Item: newItem,
          ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)',
        })
      );

       // Validate what we will return (protects against drift)
      const dbValidation = ProductSchema.safeParse(newItem);
      if (!dbValidation.success) {
        res.status(500).send({ error: 'Database validation failed' });
        return;
      }

      res.status(200).send(dbValidation.data);
    } catch (err: any) {
      // If the item didn't exist, the condition fails → treat as 404
      if (
        err?.name === 'ConditionalCheckFailedException' ||
        err?.code === 'ConditionalCheckFailedException'
      ) {
        res.status(404).send({ error: 'Product not found' });
        return;
      }
      console.error('PUT /products/:productId error:', err);
      res.status(500).send({ error: 'Failed to update product' });
    }
  }
);

router.delete('/:productId', async (req: Request<ProductIdParam> , res: Response<Product | ErrorMessage>) => {
	const productId: string = req.params.productId
	
	try {
		const deleteResult = await db.send(new DeleteCommand({
			TableName: myTable,
			Key: { Pk: 'product', Sk: `p#${productId}`},
			ReturnValues: 'ALL_OLD'
		}))
		
		if (deleteResult.Attributes) {   //Attributes - Alla fält som begärdes - ur returnvalues 'ALL_OLD' (AWS terminologi)
			const validation = ProductSchema.safeParse(deleteResult.Attributes)
			if (validation.success) {
				const deletedProduct = validation.data
				res.status(200).send(deletedProduct); //OK
			} else {
				res.status(500).send({ error: 'Database validation failed' })
			}
		} else {
			res.status(404).send({ error: 'Product not found'}) // Not found
		}
	} catch (error) {
		console.error('Error deleting product:', error)
		res.status(500).send({ error: 'Failed to delete product' }) // Server error
	}
})







export default router;