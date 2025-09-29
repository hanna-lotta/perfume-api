import { Router, Response, Request } from 'express';
import { QueryCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import { isCartItem, CartSchema } from '../data/validation.js';
import type { CartItem, GetResult } from '../data/types.js';

const router = Router();

// GET - Hämta alla cart objekt
router.get('/', async (req: Request, res: Response) => {
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
        
        res.status(500).json({ error: 'Kunde inte fetcha cart items' });
    }
});
//Hämta alla car items för en spec user
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        const result = await db.send(new QueryCommand({
            TableName: myTable,
            KeyConditionExpression: 'Pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'cart'
            }
        }));

        const userItems = result.Items?.filter(item => 
            item.Sk && item.Sk.includes(`#user#${userId}`)
        ) || [];
        
        const filtered: CartItem[] = userItems.filter((item: any): item is CartItem => isCartItem(item));
        
        res.send(filtered);

    } catch(error) {
        res.sendStatus(500);
    }
});


interface CartIdParams {
    id: string  
}

interface CartParams {
    userId: string,
    amount: number,
    
}

router.put('/:productId/user/:userId', async (req, res) => {

    try {
        const productId = req.params.productId
        const userId = req.params.userId
        const amount = req.body.amount

        
    }
})

export default router;