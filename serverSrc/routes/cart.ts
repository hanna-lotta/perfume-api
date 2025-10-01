import { Router, Response, Request } from 'express';
import { QueryCommand, UpdateCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import { isCartItem, NewCartSchema, CartSchema } from '../data/validation.js';
import type { CartItem, GetResult, ErrorMessage } from '../data/types.js';
import { any } from 'zod';

const router = Router();


// GET - Hämta alla cart objekt
router.get('/', async (req: Request, res: Response<CartItem[] | ErrorMessage>) => {
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

        
        const validCartItems = (data.Items || []) as CartItem[];

        res.status(200).send(validCartItems);
        
    } catch (error) {
        
        res.status(500).send({ error: 'Kunde inte fetcha cart items' });
    }
});

type UserIdParam = {
	userId: string;
}


//Hämta alla cart items för en spec user
router.get('/user/:userId', async (req: Request<UserIdParam>, res: Response<CartItem[] | ErrorMessage>) => {
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
        
        // Validera med Zod CartSchema
        const validatedItems: CartItem[] = [];
        
        userItems.forEach(item => {
            const validation = CartSchema.safeParse(item);
            if (validation.success) {
                validatedItems.push(validation.data);
            }
        });
        
        res.send(validatedItems);

    } catch(error) {
        res.sendStatus(500);
    }
});

// POST - skapa nytt cart item
router.post('/', async (req, res) => {

        // Valdiera data från CartSchema (userId, productId, amount) 
        const validation = CartSchema.safeParse((req.body));

        // Om valideringen misslyckas returnera bad request (400)
        if (!validation.success)
            return res.status(400).json({ error: "Invalid cart item" });

        // Plocka ut specifik data från validerad request
        const { userId, productId, amount } = validation.data;

         // Skapar ett nytt objekt (cart item) som ska sparas i databasen
        const newCartItem: CartItem = {
            Pk: "cart", // Används för att gruppera alla cart items
            Sk: `product#${productId}#user#${userId}`, // Gör varje rad unik med kombinationen produkt o användare
            userId, // Används för att enkelt kunna filtrera cart items med användare
            productId, // Används för att identifiera produkten (unikt produkt id)
            amount // Antalet produkter som är tillagt
        };

    try {
        // Lägger till cart item i DynamoDB
        await db.send(new PutCommand({
            TableName: myTable,
            Item: newCartItem
        }));
        // Returnera 201 när det har skapats
        res.status(201).json(newCartItem);
    } catch (error) {
        console.error(error);
        // Fångar olika fel som t.ex dålig nätevrks anslutning
        res.status(500).json({ error: "Could not add to cart" });
    }
})
interface CartUpdateParams {
	productId: string;
	userId: string;
}

interface PutBody {
	amount: number;
}

//uppdatera amount i cart
router.put('/:productId/user/:userId', async (req: Request<CartUpdateParams, {}, PutBody>, res: Response<CartItem | ErrorMessage>) => {
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

        res.json(result.Attributes as CartItem);

    } catch (error) {
        console.error(error);
        const errorResponse: ErrorMessage = { error: 'Server error' };
        res.status(500).json(errorResponse);
    }           
})

export default router;