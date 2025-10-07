import express from 'express';
import type { Request, Response, Router } from 'express';
import { PutCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage, GetResult, ProductBody } from '../data/types.js';
import { ProductSchema, productsPostSchema } from '../data/validation.js';
import { ProductIdParam } from '../data/types.js';

const router: Router = express.Router();

// GET - Hämtar alla produkter från DynamoDB
router.get("/", async (req: Request, res: Response<Product[] | ErrorMessage>) => { 
  try {
    const command = new QueryCommand({
      TableName: myTable, 
      KeyConditionExpression: "Pk = :pk", 
      ExpressionAttributeValues: {
        ":pk": "product"
      }
    });

    const data = await db.send(command);

    const validProducts: Product[] = [];
    (data.Items || []).forEach(item => {
      const parsed = ProductSchema.safeParse(item);
      if (parsed.success) validProducts.push(parsed.data); 
      else console.warn("Invalid product in DB:", item);
    });

    res.status(200).send(validProducts); 
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch products" });
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
		const item: Product | ErrorMessage = result.Item 
		if (item) {
			res.status(200).send(item) 
		} else {
			res.status(404).send({ error: 'Product not found'}) 
		}
	} catch (error) {
		res.status(500).send({ error: 'Failed to fetch product' }) 
	}
})


router.post('/', async (req: Request<ProductBody>, res: Response<Product | ErrorMessage>) => {
	const validation = productsPostSchema.safeParse(req.body)
	if (!validation.success) {
		res.status(400).send({ error: 'Invalid request body'}) 
		return
	}
	
	const productId: string = Date.now().toString() 
	
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
		res.status(201).send(newItem) 
	} catch (error) {
		res.status(500).send({ error: 'Failed to create product' }) 
	}
});



router.put(
	'/:productId',
	async ( req: Request<ProductIdParam,{}, ProductBody>,res: Response<Product | ErrorMessage>
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
		
		const newItem: Product = {
			Pk: 'product',
			Sk: `p#${productId}`,
			name,
			price,
			img,
			amountInStock,
		};
		
		try {
			await db.send(
				new PutCommand({
					TableName: myTable,
					Item: newItem,
					ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)',
				})
			);
			
			const dbValidation = ProductSchema.safeParse(newItem);
			if (!dbValidation.success) {
				res.status(500).send({ error: 'Database validation failed' });
				return;
			}
			
			res.status(200).send(dbValidation.data);
		} catch (err: any) {
			if (
				err?.name === 'ConditionalCheckFailedException' ||
				err?.code === 'ConditionalCheckFailedException'
			) {
				res.status(404).send({ error: 'Product not found' });
				return;
			}
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
			const validation = ProductSchema.safeParse(deleteResult.Attributes)
			if (validation.success) {
				const deletedProduct = validation.data
				res.status(200).send(deletedProduct); 
			} else {
				res.status(500).send({ error: 'Database validation failed' })
			}
		} else {
			res.status(404).send({ error: 'Product not found'}) 
		}
	} catch (error) {
		res.status(500).send({ error: 'Failed to delete product' }) 
	}
})







export default router;