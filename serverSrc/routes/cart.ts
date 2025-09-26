import type { Request, Response, Router } from 'express';
import express from 'express';
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage, GetResult } from '../data/types.js';

const router: Router = express.Router();




export default router;