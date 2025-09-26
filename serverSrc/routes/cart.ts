import type { Request, Response, Router } from 'express';
import express from 'express';
import { GetCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage } from '../data/types.js';
import {CartSchema} from "../data/validation.js"

const cartRouter: Router = express.Router();

cartRouter.get('/', async (req, res) => {
	const result = await db.send(new ScanCommand({
		TableName: myTable
	}))

	if( result.Count === undefined || result.Items === undefined ) {
		res.sendStatus(500)  
		return
	}

	let parseResult = CartSchema.safeParse(result.Items)
	if( !parseResult.success ) {
		console.log( result.Items, parseResult.error)
		res.sendStatus(500)
		return
	}

	const items: (CartItem | undefined) = parseResult.data
	const filtered: CartItem = items.filter(cart)
	
	res.send(filtered)
})


export default Router;