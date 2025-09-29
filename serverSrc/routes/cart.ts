import { Router } from 'express';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import { isCartItem, CartSchema } from '../data/validation.js';
import type { CartItem } from '../data/types.js';
import { any } from 'zod';

const router = Router();

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
        
        res.status(500).json({ error: 'Kunde inte fetcha cart items' });
    }
});

router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;

    const result = await db.send(new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: 'Pk = :pk',
        ExpressionAttributeValues: {
            ':pk': 'cart'
        }
    }));

    try {
        
        const userItems = result.Items?.filter(item => 
            item.Sk && item.Sk.includes(`#user#${userId}`)
        ) || [];
        
        const filtered: CartItem[] = userItems.filter((item: any): item is CartItem => isCartItem(item));
        
        res.send(filtered);

    } catch(error) {
        res.sendStatus(500);
    }
});

export default router;