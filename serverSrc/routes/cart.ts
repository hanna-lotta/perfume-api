import { Router, Response, Request } from 'express';
import { QueryCommand, PutCommand,DeleteCommand } from '@aws-sdk/lib-dynamodb';
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import { NewCartSchema, CartSchema,CartDeleteParamsSchema} from '../data/validation.js';
import type { CartItem, CartItemBody, ErrorMessage } from '../data/types.js';

const router = Router();

// GET - Hämta alla cart objekt
router.get('/', async (req: Request, res: Response<CartItem[] | ErrorMessage>) => {
    try {
        const command = new QueryCommand({
            TableName: myTable,
            KeyConditionExpression: 'Pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'cart'
            }
        });

        const data = await db.send(command);

        const validCartItems: CartItem[] = [];
        
        (data.Items || []).forEach(item => {
            const validation = CartSchema.safeParse(item);
            if (validation.success) {
                validCartItems.push(validation.data);
            }
        });

        res.status(200).send(validCartItems);
        
    } catch (error) {
        
        res.status(500).send({ error: 'Can not fetch cart items' });
    }
});

type UserIdParam = {
	userId: string;
}


//Hämta alla cart items för en spec user
router.get('/user/:userId', async (req: Request<UserIdParam>, res: Response<CartItem[] | ErrorMessage>) => {
    try {
        const userId = req.params.userId;
        
        const userIdValidation = NewCartSchema.shape.userId.safeParse(userId);
        if (!userIdValidation.success) {
            return res.status(400).send({ error: 'Invalid userId format' });
        }

        const result = await db.send(new QueryCommand({
            TableName: myTable,
            KeyConditionExpression: 'Pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'cart'
            }
        }));

        const validatedItems: CartItem[] = [];
        
        (result.Items || []).forEach(item => {
            const validation = CartSchema.safeParse(item);
            if (validation.success && validation.data.Sk.includes(`#user#${userId}`)) {
                validatedItems.push(validation.data);
            } else if (validation.success) {                
            
            
            } else {
                if (validation.error) {
                    console.log('Validation errors:', validation.error.issues);
                }
            }
        });
        
        res.send(validatedItems);

    } catch(error) {
        res.sendStatus(500);
    }
});

// POST - skapa nytt cart item
router.post('/', async (req: Request<CartItemBody>, res: Response<CartItem | ErrorMessage>) => {

        const validation = NewCartSchema.safeParse((req.body));

        if (!validation.success)
            return res.status(400).send({ error: "Invalid cart item" });

        const { userId, productId, amount } = validation.data;

        const newCartItem: CartItem = {
            Pk: "cart", 
            Sk: `product#${productId}#user#${userId}`, 
            userId, 
            productId, 
            amount 
        };

    try {
        await db.send(new PutCommand({
            TableName: myTable,
            Item: newCartItem
        }));
        res.status(201).send(newCartItem);
    } catch (error) {
        res.status(500).send({ error: "Could not add to cart" });
    }
})

interface CartParams {
	productId: string;
	userId: string;
}

interface PutBody {
	amount: number;
}

//uppdatera amount i cart
router.put('/:productId/user/:userId', async (req: Request<CartParams, {}, PutBody>, res: Response<CartItem | ErrorMessage>) => {
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
            return res.status(400).send(errorResponse);
        }

        const cartItem: CartItem = {
            Pk: 'cart',
            Sk: `product#${productId}#user#${userId}`,
            userId: userId,
            productId: productId,
            amount: amount
        };

        const result = await db.send(new PutCommand({
            TableName: myTable,
            Item: cartItem,
            ReturnValues: 'ALL_OLD'
        }));
        res.send(cartItem);

    } catch (error) {
        const errorResponse: ErrorMessage = { error: 'Server error' };
        res.status(500).send(errorResponse);
    }           
})



interface Message {
  message: string;
}


router.delete(
  '/:productId/user/:userId',
  async (req: Request<CartParams>, res: Response<Message | ErrorMessage>) => {
    const parsed = CartDeleteParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).send({ error: 'Invalid userId or productId' });
    }
    const { productId, userId } = parsed.data;

    const pk = 'cart';
    const sk = `product#${productId}#user#${userId}`;

    try {
      const deleteCommand = new DeleteCommand({
        TableName: myTable,
        Key: { Pk: pk, Sk: sk },
        ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)',
      });

      await db.send(deleteCommand);

      return res.status(200).send({
        message: `Product ${productId} removed from cart for user ${userId}`,
      });
    } catch (error: any) {
      if (error?.name === 'ConditionalCheckFailedException') {
        return res.status(404).send({ error: 'Cart item not found' });
      }
      return res.status(500).send({ error: 'Internal server error' });
    }
  }
);


export default router;