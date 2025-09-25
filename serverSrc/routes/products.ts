import express from 'express';
import type { Request, Response, Router } from 'express';
import * as z from "zod"
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { Product, ErrorMessage } from '../data/types.js';


const router: Router = express.Router();






export default router;