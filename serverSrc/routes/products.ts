import express from 'express';
import type { Request, Response, Router } from 'express';
import * as z from "zod"
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage } from '../data/types.js';


const router: Router = express.Router();


const productsPostSchema = z.object ({
	name: z.string(),
	price: z.number(),
	img: z.string(),
	amountinstock: z.number()
})

router.post('/:productId', async (req: Request , res: Response<Product | ErrorMessage>) => {
	const validation = productsPostSchema.safeParse(req.body)
	if (!validation.success) {
		res.status(400).send({ error: 'Invalid request body'})
		return
	}
  const productId = req.params.productId
  if (!productId) {
	res.status(400).send({error: 'productId is required'})
  	return
  }
  const { name, price, img, amountinstock} = validation.data
  const newItem: Product = {
	productId,
	pk: 'product',
	name,
	price,
	img,
	amountinstock
  }
  await db.send(new PutCommand({
	TableName: myTable,
	Item: newItem
  }))
  res.status(201).send(newItem) // created
});









export default router;