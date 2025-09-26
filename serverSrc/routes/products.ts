import express from 'express';
import type { Request, Response, Router } from 'express';
import * as z from "zod"
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage } from '../data/types.js';


const router: Router = express.Router();

const client = new DynamoDBClient({  
    region: "eu-north-1",
    credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!
  }});


router.get("/", async (req, res) => {
  try {
    const command = new ScanCommand({ TableName: "Products" });
    const data = await client.send(command);
    res.status(200).json(data.Items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});



export default router;