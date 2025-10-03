import * as z from "zod"
import express, { type Request, type Response, type Router } from 'express'
import { QueryCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import db, { myTable } from '../data/dynamodb.js'
import { userPostSchema, userSchema } from '../data/validation.js'
import { User, ErrorMessage, UserRes, GetUsersRes } from "../data/types.js"



const router: Router = express.Router()

// GET /api/users - get all users from DynamoDB
router.get('/', async (req: Request, res: Response<GetUsersRes | ErrorMessage>) =>  { 
  try {
    // query-kommandot
    const command = new QueryCommand({
      TableName: myTable, // Tabellen i DynamoDB
      KeyConditionExpression: "Pk = :pk", // Filtrerar partition key
      ExpressionAttributeValues: {
        ":pk": `user`
      }
    });

    const data = await db.send(command); // Frågar DynamoDB efter alla items med Pk


    // Mappa varje item för att kolla så att de är rätt datatyper
    const users: User[] = (data.Items ?? []).map((item) => ({
      Pk: item.Pk,
      Sk: item.Sk,
      username: String(item.username),
    }));

    // Returnerar listan med produkter
    res.status(200).send({ users }); // Lägger users i ett objekt 
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch user" });
  }
});


// GET /api/users/:id - get one user by id
router.get('/:userId', async (req: Request<{ userId: string }>, res: Response<UserRes | ErrorMessage>) => {
    try {
      const userId = req.params.userId;

      const result = await db.send(new GetCommand({
        TableName: myTable,
        Key: { 
          Pk: 'user', 
          Sk: `user#${userId}` }
      }));

      if (!result.Item) return res.status(404).send({ error: 'User not found' });

      const validated = userSchema.safeParse(result.Item);
      if (!validated.success) {
        return res.status(500).send({ error: 'Invalid user data in database' });
      }

      res.status(200).send({ user: validated.data });

    } catch (err) {
      console.error(err);
      res.status(500).send({ error: 'Failed to fetch user' });
    }
});


// POST /api/users - create a new user { name }
router.post('/', async (req: Request, res: Response<UserRes | ErrorMessage>) => {
  try {
    // validate body
    const parsed = userPostSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).send({ error: 'Invalid body' })
    }
    const { username } = parsed.data

    // create id
    const userId = Math.floor(Math.random()*100)

    const newUser = {
          Pk: 'user',
          Sk: `user#${userId}`,
          username,
    }

    // Save user (overwrite allowed if same key is reused)
    await db.send(new PutCommand({
        TableName: myTable,
        Item: newUser,
      }))

      const validated = userSchema.parse(newUser)
      res.status(201).send({ user: validated })

    } catch (err) {
      console.error(err)
      res.status(500).send({ error: 'Failed to create user' })
    }
})

// PUT /api/users/:id - update user's name
export interface UpdateUserResponse {
  userId: string;
  username: string;
}
router.put('/:id', async (req: Request, res: Response<UpdateUserResponse | ErrorMessage>) => {
  try {
    const userId = req.params.id;

    // NEW (comment fix): validate body must have { username }
    const parsed = userPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    }
    const { username } = parsed.data;

    // NEW: update username; fail if the user does not exist
    const result = await db.send(new UpdateCommand({
      TableName: myTable,
      Key: { 
        Pk: 'user',
        Sk: `user#${userId}`
      },
      UpdateExpression: 'SET username = :username',
      // OLD: ExpressionAttributeNames was here but commented out
      // OLD: // ExpressionAttributeNames: { '#n': 'username' },
      // NEW: remove ExpressionAttributeNames entirely (not needed)
      ExpressionAttributeValues: { ':username': username },
      ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)',
      ReturnValues: 'ALL_NEW',
    }))

    // NEW: keep response shape consistent with UpdateUserResponse
    const updatedUserName = String(result.Attributes?.username ?? username);
    return res.status(200).json({ userId, username: updatedUserName });

  } catch (err: unknown) {
    // OLD: checked err.username === 'ConditionalCheckFailedException' (wrong)
    // NEW: check err.name properly
    if (
      typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as { name?: string }).name === 'ConditionalCheckFailedException'
    ) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.error(err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
})

/*
router.put('/:id', async (req: Request, res: Response) => {
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    // validate body: must have { name }
    const parsed = userPostSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues })
    }
    const { username } = parsed.data

    // update name; fail if the user does not exist
    const result = await db.send(new UpdateCommand({
        TableName: myTable,
        Key: { Pk: `user`,
             Sk: `user#${userId}`
            },        
      UpdateExpression: 'SET username = :username',
        ExpressionAttributeValues: { ':username': username },
        ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)',
        ReturnValues: 'ALL_NEW',


    }));

    const updatedUserName = String(result.Attributes?.username ?? username)
    res.status(200).send({ userId, username: updatedUserName })
  } catch (err: unknown) {
    // if user doesn't exist - 404
    if (
      typeof err === 'object' &&
      err &&
      'username' in err &&
      (err as { username?: string }).username === 'ConditionalCheckFailedException'
    ) {
      return res.status(404).send({ error: 'User not found' })
    }
    console.error(err)
    res.status(500).send({ error: 'Failed to update user' })
  }
})
*/

// DELETE - Ta bort användare med id
router.delete('/:userId', async (req: Request<{ userId: string }>, res: Response<UserRes | ErrorMessage>) => {
    const userId = req.params.userId;

    try {
      const deleteResult = await db.send(
        new DeleteCommand({
          TableName: myTable,
          Key: { Pk: 'user', Sk: `user#${userId}` },
          ReturnValues: 'ALL_OLD',
        })
      );

      if (deleteResult.Attributes) {
        // validera användaren som togs bort
        const validated = userSchema.safeParse(deleteResult.Attributes);
        if (validated.success) {
          return res.status(200).send({ user: validated.data });
        } else {
          return res.status(500).send({ error: 'Database validation failed' });
        }
      } else {
        return res.status(404).send({ error: `User ${userId} not found` });
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      return res.status(500).send({ error: `Could not delete user ${userId}` });
    }

});

export default router
