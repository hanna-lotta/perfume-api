import express from 'express';
import type { Request, Response, Router } from 'express';
import { PutCommand, DeleteCommand, GetCommand, DynamoDBDocumentClient, } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import * as z from "zod"
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage, GetResult } from '../data/types.js';
import { productsPostSchema } from '../data/validation.js';
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
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

router.get('/:productId', async (req, res) => {
	const productId: string = req.params.productId
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
		res.send(item)
	} else {
		res.status(404).send({ error: 'Product not found'})
	}
})


// POST
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



// PUT


router.put('/:productId', async (req: Request, res: Response<Product | ErrorMessage>) => {
  // Validate full body using your existing schema
  const validation = productsPostSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).send({ error: 'Invalid request body' }); // Bad request
    return;
  }

  const productId: string = req.params.productId;
  if (!productId) {
    res.status(400).send({ error: 'productId is required' }); // Bad request
    return;
  }

  const { name, price, img, amountInStock } = validation.data;

  try {
    const update = new UpdateCommand({
      TableName: myTable,
      Key: { Pk: 'product', Sk: `p#${productId}` },
      // Prevent creating a new item if it doesn't exist
      ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)',
      UpdateExpression: 'SET #n = :name, price = :price, img = :img, amountInStock = :stock',
      ExpressionAttributeNames: {
        '#n': 'name', // "name" can be a reserved word
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':price': price,
        ':img': img,
        ':stock': amountInStock,
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await db.send(update);

    // DynamoDB returns Attributes with the updated item when ReturnValues = 'ALL_NEW'
    const updated = result.Attributes as Product | undefined;

    if (!updated) {
      // Shouldn't normally happen with ALL_NEW, but just in case
      res.status(500).send({ error: 'Failed to update product' });
      return;
    }

    res.status(200).send(updated); // OK
  } catch (err: any) {
    if (err?.name === 'ConditionalCheckFailedException') {
      res.status(404).send({ error: 'Product not found' }); // Not found
      return;
    }
    console.error(err);
    res.status(500).send({ error: 'Failed to update product' }); // Server error
  }
});



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

router.delete('/:productId', async (req: Request<ProductIdParam> , res: Response<Product | ErrorMessage>) => {
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


// Hämtar alla produkter från DynamoDB
router.get("/", async (req, res) => {
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
		res.status(404).send({ error: 'Product not found'}) // Not found, ingen produkt med deet IDt
	}
})



export default router;