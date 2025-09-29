import { Router, Response, Request } from 'express';
import { QueryCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import { isCartItem, NewCartSchema } from '../data/validation.js';
import type { CartItem, GetResult, ErrorMessage } from '../data/types.js';

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
//Hämta alla cart items för en spec user
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

//uppdatera amount i cart
router.put('/:productId/user/:userId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.params.userId;
        const amount = req.body.amount;

        const cartValidation = NewCartSchema.safeParse({
            userId: userId,
            productId: productId,
            amount: amount
        });

        if (!cartValidation.success) {
            const errorResponse: ErrorMessage = { error: 'Invalid data' };
            return res.status(400).json(errorResponse);
        }

        const Pk = 'cart';
        const Sk = `product#${productId}#user#${userId}`;

        const result = await db.send(new UpdateCommand({
            TableName: myTable,
            Key: { Pk, Sk },
            UpdateExpression: 'SET amount = :amount',
            ExpressionAttributeValues: {
                ':amount': amount
            },
            ReturnValues: 'ALL_NEW'
        }));

        if (!result.Attributes) {
            const errorResponse: ErrorMessage = { error: 'Failed to update cart item' };
            return res.status(404).json(errorResponse);
        }

        res.json(result.Attributes);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }           
})

export default router;