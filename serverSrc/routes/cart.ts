import type { Request, Response, Router } from 'express';
import express from 'express';
import { GetCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import type { CartItem, Product, ErrorMessage } from '../data/types.js';
import {CartSchema, isCartItem} from "../data/validation.js"


const router: Router = express.Router();



export default router;