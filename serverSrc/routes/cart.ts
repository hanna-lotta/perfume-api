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
        
        const result = await db.send(new QueryCommand({
            TableName: myTable,
            KeyConditionExpression: 'Pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'cart'
            }
        }));

        console.log(`Hitta ${result.Items?.length || 0} items i DynamoDB`);

        // filterera/validera med isCartItem
        const validCartItems: CartItem[] = result.Items?.filter((item: any): item is CartItem => isCartItem(item)) || [];
        
        console.log(`filtrerad ${result.Items?.length || 0} items → ${validCartItems.length} valid cart items`);
        
        res.json(validCartItems);
        
    } catch (error) {
        console.error('Error med att hämta items:', error);
        res.status(500).json({ error: 'Kunde inte fetcha cart items' });
    }
});

export default router;