import { Router, Response, Request } from 'express';
import { QueryCommand, UpdateCommand, PutCommand,DeleteCommand } from '@aws-sdk/lib-dynamodb';
import db from '../data/dynamodb.js';
import { myTable } from '../data/dynamodb.js';
import { NewCartSchema, CartSchema,CartDeleteParamsSchema} from '../data/validation.js';
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

        // Validera varje item från DynamoDB med CartSchema
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
        
        // Validera userId parameter med NewCartSchema userId regler
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

        // Validera och filtrera i samma steg - helt typsäkert
        const validatedItems: CartItem[] = [];
        
        (result.Items || []).forEach(item => {
            const validation = CartSchema.safeParse(item);
            if (validation.success && validation.data.Sk.includes(`#user#${userId}`)) {
                validatedItems.push(validation.data);
            } else {
                console.log('Validation failed for item:', item);
                if (validation.error) {
                    console.log('Validation errors:', validation.error.issues);
                }
            }
        });
        
        console.log(`After validation: ${validatedItems.length} valid items`);
        res.send(validatedItems);

    } catch(error) {
        res.sendStatus(500);
    }
});

// POST - skapa nytt cart item
router.post('/', async (req: Request, res: Response<CartItem | ErrorMessage>) => {

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

        // TypeScript ser till att cartItem matchar CartItem interface
        const responseItem: CartItem = cartItem;
        res.send(responseItem);

    } catch (error) {
        console.error(error);
        const errorResponse: ErrorMessage = { error: 'Server error' };
        res.status(500).send(errorResponse);
    }           
})



/** Params interface for DELETE /api/cart/:productId/user/:userId */
interface CartDeleteParams {
  productId: string;
  userId: string;
}

/**
 * DELETE - remove one product from one user's cart
 * Example calls:
 *   DELETE /api/cart/p1/user/user1
 *   DELETE /api/cart/p5/user/user2
 */
router.delete(
  '/:productId/user/:userId',
  async (req: Request<CartDeleteParams>, res: Response<{ message: string } | ErrorMessage>) => {
    // 1) Validate params with Zod (reused from NewCartSchema)
    const parsed = CartDeleteParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).send({ error: 'Invalid userId or productId' });
    }
    const { productId, userId } = parsed.data;//On success, Zod gives you a typed, safe object

    // 2) Build PK/SK based on your current model + CartSchema.Sk regex
    //    Sk must look like: product#p<digits>#user#<userId>
    const pk = 'cart';
    const sk = `product#${productId}#user#${userId}`;

    try {
      // 3) Delete with a condition so we return 404 for non-existing items
      const deleteCommand = new DeleteCommand({
        TableName: myTable,
        Key: { Pk: pk, Sk: sk },
        ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)',
      });//Only delete if the item actually exists
      // If it doesn’t exist, DynamoDB throws ConditionalCheckFailedException.

      await db.send(deleteCommand);

      // 4) Success
      return res.status(200).send({
        message: `Product ${productId} removed from cart for user ${userId}`,
      });
    } catch (error: any) {
      // If the item didn't exist, DynamoDB throws ConditionalCheckFailedException
      if (error?.name === 'ConditionalCheckFailedException') {
        return res.status(404).send({ error: 'Cart item not found' });
      }
      console.error('DELETE /api/cart error:', error);
      return res.status(500).send({ error: 'Internal server error' });
    }
  }
);


export default router;