import { Router, Response, Request } from 'express';
import { QueryCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import { isCartItem, NewCartSchema, CartSchema } from '../data/validation.js';
import type { CartItem, ErrorMessage } from '../data/types.js';

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
        
        console.log(`Found ${userItems.length} items for user ${userId}:`, userItems);
        
        // Validera med Zod CartSchema
        const validatedItems: CartItem[] = [];
        
        userItems.forEach(item => {
            const validation = CartSchema.safeParse(item);
            if (validation.success) {
                validatedItems.push(validation.data);
            } else {
                console.log('Validation failed for item:', item);
                console.log('Validation errors:', validation.error.issues);
            }
        });
        
        console.log(`After validation: ${validatedItems.length} valid items`);
        res.send(validatedItems);

    } catch(error) {
        res.sendStatus(500);
    }
});

// POST - skapa nytt cart item
router.post('/', async (req, res) => {

        // Valdiera data från NewCartSchema (userId, productId, amount) 
        const validation = NewCartSchema.safeParse((req.body));

        // Om valideringen misslyckas returnera bad request (400)
        if (!validation.success)
            return res.status(400).send({ error: "Invalid cart item" });

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
        res.status(201).send(newCartItem);
    } catch (error) {
        console.error(error);
        // Fångar olika fel som t.ex dålig nätevrks anslutning
        res.status(500).send({ error: "Could not add to cart" });
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
            return res.status(400).send(errorResponse);
        }

        // Skapa komplett cart item för upsert
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

        // PutCommand lyckas alltid, returnera det item vi skapade/uppdaterade
        const validationResult = CartSchema.safeParse(cartItem);
        
        if (!validationResult.success) {
            console.error('Invalid cart item structure:', validationResult.error);
            const errorResponse: ErrorMessage = { error: 'Invalid cart item data' };
            return res.status(500).send(errorResponse);
        }

        res.send(validationResult.data);

    } catch (error) {
        console.error(error);
        const errorResponse: ErrorMessage = { error: 'Server error' };
        res.status(500).send(errorResponse);
    }           
})

export default router;