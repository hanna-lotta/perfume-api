import { Router } from 'express';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import { isCartItem } from '../data/validation.js';
import type { CartItem } from '../data/types.js';

const router = Router();

// GET - Hämta alla cart objekt
router.get('/', async (req, res) => {
    try {
        console.log(myTable);
        
        const command = new QueryCommand({
            TableName: myTable,
            KeyConditionExpression: 'Pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'cart'
            }
        });

        const data = await db.send(command);

        // Filtrera och validera med isCartItem
        const validCartItems: CartItem[] = data.Items?.filter((item: any): item is CartItem => isCartItem(item)) || [];

        res.status(200).json(validCartItems);
        
    } catch (error) {
        console.error('Error med att hämta:', error);
        res.status(500).json({ error: 'Kunde inte fetcha cart items' });
    }
});

export default router;