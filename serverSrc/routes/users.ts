import * as z from "zod"
import express, { type Request, type Response, type Router } from 'express'
import { QueryCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import db, { myTable } from '../data/dynamodb.js'
import { userPostSchema } from '../data/validation.js'
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
      id: String(item.id),
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
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
     const userId = req.params.id
    try {


    let getCommand = new GetCommand({
      TableName: myTable,
      Key: {
        Pk: 'user',
        Sk: `user#${userId}`	  	
      }
    })

    const result = await db.send(getCommand)
    const item:  User | undefined;

    if (item) {
      res.status(200).send(item)
    } else {
      res.status(404).send({ error: 'user not found'})
    }

  } catch (err) {
       console.error(err)
      res.status(500).send({ error: 'Failed to fetch user' })
  }
})
	


// POST /api/users - create a new user { name }
router.post('/', async (req: Request, res: Response) => {
  try {
    // validate body
    const parsed = userPostSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).send({ error: 'Invalid body', issues: parsed.error.issues })
    }
    const { username } = parsed.data

    // create id
    const id = Math.floor(Math.random()*100)

    // Save user (overwrite allowed if same key is reused)
    await db.send(
      new PutCommand({
        TableName: myTable,
        Item: {
          Pk: 'user',
          Sk: `user#${id}`,
          username,
        },
      })
    )

  res.status(201).send({ id, username })
  } catch (err: unknown) {
    console.error(err)
    res.status(500).send({ error: 'Failed to create user' })
  }
})

// PUT /api/users/:id - update user's name
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // validate body: must have { name }
    const parsed = userPostSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).send({ error: 'Invalid body', issues: parsed.error.issues })
    }
    const { username } = parsed.data

    // update name; fail if the user does not exist
    const result = await db.send(new UpdateCommand({
        TableName: myTable,
        Key: { Pk: `user`,
             Sk: `user#${userId}`
            },        
      UpdateExpression: 'SET username = :username',
        // ExpressionAttributeNames: { '#n': 'username' },
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


// DELETE - Ta bort användare med id
router.delete('/:id', async (req: Request<{ id: string }>, res: Response<{ message: string } | ErrorMessage>) => {
   const userId = req.params.id;

  try {
    // console.log('DELETE pk=',  `user#${userId}`)
    await db.send(new DeleteCommand({
      TableName: myTable, 
      Key: { Pk: `user`,
             Sk: `user#${userId}`
      },
      ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)',

      }));

   res.status(200).send({ message: `User ${userId} deleted successfully` });

} catch (error: any) { 
    console.error(error);

    if (error.name === 'ConditionalCheckFailedException') {
      return res.status(404).send({ error: `User ${userId} not found` });
    }

    res.status(500).send({ error: `Could not delete user ${userId}` });
}
});

export default router
