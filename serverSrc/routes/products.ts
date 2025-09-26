import express from 'express';
import type { Request, Response, Router } from 'express';
import * as z from "zod"
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage } from '../data/types.js';


const router: Router = express.Router();

// Skapar DynamoDB-klienten
const client = new DynamoDBClient({  
    region: "eu-north-1",
    credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!
  }});

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



export default router;