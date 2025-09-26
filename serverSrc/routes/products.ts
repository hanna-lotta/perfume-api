import express from 'express';
import type { Request, Response, Router } from 'express';
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage, GetResult } from '../data/types.js';
import { productsPostSchema } from '../data/validation.js';


const router: Router = express.Router();




router.post('/:productId', async (req: Request , res: Response<Product | ErrorMessage>) => {
	const validation = productsPostSchema.safeParse(req.body)
	if (!validation.success) {
		res.status(400).send({ error: 'Invalid request body'}) //Bad request
		return
	}
  const productId = req.params.productId
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
  await db.send(new PutCommand({
	TableName: myTable,
	Item: newItem
  }))
  res.status(201).send(newItem) // created
});









export default router;