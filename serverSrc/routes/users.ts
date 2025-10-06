import * as z from "zod"
import express, { type Request, type Response, type Router } from 'express'
import { QueryCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import db, { myTable } from '../data/dynamodb.js'
import { userPostSchema, userSchema, validateId } from '../data/validation.js'
import { User, ErrorMessage, UserRes, GetUsersRes, PutUserParam, UserIdParam } from "../data/types.js"

const router: Router = express.Router()


// GET /api/users - get all users from DynamoDB
router.get('/', async (req: Request, res: Response<GetUsersRes | ErrorMessage>) =>  { 
  try {
    // Skapar ett QueryCommand för att hämta alla objekt med partition key
    const command = new QueryCommand({
      TableName: myTable, // Tabellen i DynamoDB
      KeyConditionExpression: "Pk = :pk", // Filtrerar partition key
      ExpressionAttributeValues: {
        ":pk": `user`
      }
    });

    const data = await db.send(command); // Frågar DynamoDB efter alla items med Pk


    // Skapar en lista med validerade users
    const users: User[] = [];
    for (const item of data.Items ?? []) { // Loopar varje item från DB, ( ?? [] används för att undvika fel om Items är undefined)
      const parsed = userSchema.safeParse(item); // Validerar item från UserSchema(används för att servern inte ska krascha vid fel users)
      if (parsed.success) {
        users.push(parsed.data); // Lägger till endast giltiga users i listan/array 
      } else {
        console.error("Invalid user in DB:", item);
      }
    }

    // Returnerar listan med användare
    res.status(200).send({ users }); 
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch user" }); // Returnerar serverfel
  }
});


// GET /api/users/:id - Hämta en användare med ID
// Get one user by id
router.get('/:id', async (req: Request<UserIdParam>, res: Response<UserRes | ErrorMessage>) => {
    try {
      // Validerar Id från url parametern med hjälp av zod
      // använder safeparse för att garanetar rätt datatyp från DB
      const idParsed = validateId(req.params.id)
       if (!idParsed.success) return res.status(400).send({ error: 'Invalid id' })

      const newId = idParsed.data; // Hämtar de validerade id

      // Hämtar user från DB
      const result = await db.send(new GetCommand({
        TableName: myTable,
        Key: { 
          Pk: 'user', 
          Sk: `user#${newId}` }
      }));

      if (!result.Item) return res.status(404).send({ error: 'User not found' }); // Returnera 404 om user inte finns

      // Validerar databasen innan vi skickar tillbaka user
      const validated = userSchema.safeParse(result.Item);
      if (!validated.success) {
        return res.status(500).send({ error: 'Invalid user data in database' });
      }

      res.status(200).send({ user: validated.data }); // Returnerar user

    } catch (err) {
      console.error(err);
      res.status(500).send({ error: 'Failed to fetch user' }); // Setverfel
    }
});


// POST /api/users - create a new user { name }
router.post('/', async (req: Request, res: Response<UserRes | ErrorMessage>) => {
  try {
    // validate body
    // Validerar request body med hjälp av zod
    const parsed = userPostSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).send({ error: 'Invalid body' })
    }
    const { username } = parsed.data // Hämtar username från requestet

    // create id
    // Skapar nytt id (medveten om att de är risk för krock) 
    // använd UUID vid publicering
    const newId: string = (Math.floor(Math.random()* 1000000) + 1).toString()

    // Skapar de nya user objektet
    const newUser = {
          Pk: 'user',
          Sk: `user#${newId}`,
          username,
    }

    // Save user (overwrite allowed if same key is reused)
    // Sparar user i DB
    // Putcommand skrivs lver om samma key redan finns
    await db.send(new PutCommand({
        TableName: myTable,
        Item: newUser,
      }))

      // Validerar user objektet innan vi skickar tillbaka
      const validated = userSchema.parse(newUser)
      res.status(201).send({ user: validated }) // User har skapats

    } catch (err) {
      console.error(err)
      res.status(500).send({ error: 'Failed to create user' }) //Serverfel
    } 
})


// Inteface för PUT
export interface UpdateUserResponse {
  user: User;
}
// PUT /api/users/:id - update user's name
router.put('/:id', async (req: Request<PutUserParam>, res: Response<UpdateUserResponse | ErrorMessage>) => {

  try {
    // Validerar id
    const idParsed = validateId(req.params.id)
    if (!idParsed.success) return res.status(400).send({ error: 'Invalid id' })
   
    const id = idParsed.data;

    // NEW (comment fix): validate body must have { username }
    // Validerar request body
    const parsed = userPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send({ error: 'Invalid body', issues: parsed.error.issues });
    }
    const { username } = parsed.data;

    // Uppdaterar användaren i DB, fail om user inte finns
    // NEW: update username; fail if the user does not exist
    const result = await db.send(new UpdateCommand({
      TableName: myTable,
      Key: { 
        Pk: 'user',
        Sk: `user#${id}`
      },
      UpdateExpression: 'SET username = :username', // Sätter nytt värde
      ExpressionAttributeValues: { ':username': username },
      ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)', // ser till så att man inte uppdaterar icke existerande users
      ReturnValues: 'ALL_NEW', // Returnerar nya objektet
    }))

    // Uppdaterar user innan de skickar tillbaka
    const validated = userSchema.safeParse(result.Attributes);
        if (!validated.success) {
          return res.status(500).send({ error: 'Invalid user data in database' });
        }

        return res.status(200).send({ user: validated.data }); // Returnerar uppdaterad user


    } catch (err) { // Fångar fel
    console.error(err) // Loggar felen i konsolen
    return res.status(500).send({ error: 'Failed to update user' }) // Serverfel
  }
})


// DELETE - Ta bort användare med id
router.delete('/:id', async (req: Request<UserIdParam>, res: Response<UserRes | ErrorMessage>) => {
    const userId = req.params.id;

    try {
      //  validerar id
      const idParsed = validateId(req.params.id)
      if (!idParsed.success) return res.status(400).send({ error: 'Invalid id' })
      const parsedId = idParsed.data;

    // Tar bort user från DB 
      const deleteResult = await db.send(
        new DeleteCommand({
          TableName: myTable,
          Key: { 
            Pk: 'user', 
            Sk: `user#${parsedId}` 
          },
          ReturnValues: 'ALL_OLD', // Returnerar objektet som togs bort, gör att man kan validera det borttagna objektet
        })
      );

      if (deleteResult.Attributes) {
        // validera user/objektet som togs bort
        const validated = userSchema.safeParse(deleteResult.Attributes);
        if (validated.success) {
          return res.status(200).send({ user: validated.data });
        } else {
          return res.status(500).send({ error: 'Database validation failed' });
        }
      } else {
        return res.status(404).send({ error: `User ${parsedId} not found` });
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      return res.status(500).send({ error: `Could not delete user ${userId}` });
    }

});

export default router