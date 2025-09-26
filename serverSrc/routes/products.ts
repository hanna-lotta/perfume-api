import express from 'express';
import type { Request, Response, Router } from 'express';
import { PutCommand, DeleteCommand, DynamoDBDocumentClient, } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
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
  await db.send(new PutCommand({
	TableName: myTable,
	Item: newItem
  }))
  res.status(201).send(newItem) // created
});

router.delete('/:productId', async (req: Request , res: Response<Product | ErrorMessage>) => {
	const productId: string = req.params.productId
	const deleteResult = await db.send(new DeleteCommand({
		TableName: myTable,
		Key: { Pk: 'product', Sk: `p#${productId}`},
		ReturnValues: 'ALL_OLD'
}))
	if (deleteResult.Attributes) {
		const deletedProduct = deleteResult.Attributes as Product;
		res.status(200).send(deletedProduct); //OK
	} else {
		res.status(404).send({ error: 'Produkt not found'}) // Not found
	}
})








export default router;