import express from 'express';
import type { Request, Response, Router } from 'express';
import { PutCommand, DeleteCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage, GetResult } from '../data/types.js';
import { productsPostSchema } from '../data/validation.js';
import { ProductIdParam } from '../data/types.js';

const router: Router = express.Router();

// GET - Hämtar alla produkter från DynamoDB
router.get("/", async (req, res) => { // Req param
  try {
    // query-kommandot
    const command = new QueryCommand({
      TableName: myTable, // Tabellen i DynamoDB
      KeyConditionExpression: "Pk = :pk", // Filtrerar partition key
      ExpressionAttributeValues: {
        ":pk": "product"
      }
    });

    const data = await db.send(command); // Frågar DynamoDB efter alla items med Pk

    res.status(200).json(data.Items); // Returnerar listan med produkter
  } catch (error) {
    console.error(error);
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
router.put('/:productId', async (req: Request, res: Response<Product | ErrorMessage>) => {
  // Validate full body using your existing schema
  const validation = productsPostSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).send({ error: 'Invalid request body' }); // Bad request
    return;
  }

    const { productId } = req.params;
    if (!productId) {
      res.status(400).send({ error: 'productId is required' });
      return;
    }

    const { name, price, img, amountInStock } = validation.data;

    try {
      const cmd = new UpdateCommand({
        TableName: myTable,
        Key: { Pk: 'product', Sk: `p#${productId}` },
        ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)',
        UpdateExpression: 'SET #name = :name, #price = :price, #img = :img, #stock = :stock',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#price': 'price',
          '#img': 'img',
          '#stock': 'amountInStock',
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':price': price,
          ':img': img,
          ':stock': amountInStock,
        },
        ReturnValues: 'ALL_NEW',
      });

      const result = await db.send(cmd);
      const updated = result.Attributes as Product | undefined;

      if (!updated) {
        res.status(500).send({ error: 'Failed to update product' });
        return;
      }

      res.status(200).send(updated);
    } catch (err: any) {
      if (err?.name === 'ConditionalCheckFailedException' || err?.code === 'ConditionalCheckFailedException') {
        res.status(404).send({ error: 'Product not found' });
        return;
      }
      console.error('PUT /products/:productId error:', err?.name, err?.message);
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
		
		if (deleteResult.Attributes) {
			const deletedProduct = deleteResult.Attributes as Product;
			res.status(200).send(deletedProduct); //OK
		} else {
			res.status(404).send({ error: 'Product not found'}) // Not found
		}
	} catch (error) {
		console.error('Error deleting product:', error)
		res.status(500).send({ error: 'Failed to delete product' }) // Server error
	}
})







export default router;