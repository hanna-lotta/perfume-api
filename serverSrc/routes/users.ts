import * as z from "zod"
import express, { type Request, type Response, type Router } from 'express'
import { QueryCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import db, { myTable } from '../data/dynamodb.js'
import { userPostSchema, userSchema, validateId } from '../data/validation.js'
import { User, ErrorMessage, UserRes, GetUsersRes, PutUserParam, UserIdParam, UserBody } from "../data/types.js"


const router: Router = express.Router()


// GET /api/users - get all users from DynamoDB
router.get('/', async (req: Request, res: Response<GetUsersRes | ErrorMessage>) =>  { 
  try {
    const command = new QueryCommand({
      TableName: myTable, 
      KeyConditionExpression: "Pk = :pk", 
      ExpressionAttributeValues: {
        ":pk": `user`
      }
    });

    const data = await db.send(command); 

    const users: User[] = [];
    for (const item of data.Items ?? []) { 
      const parsed = userSchema.safeParse(item); 
      if (parsed.success) {
        users.push(parsed.data); 
      } else {
        console.error("Invalid user in DB:", item);
      }
    }

    
    res.status(200).send({ users }); 
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch user" }); 
  }
});


// GET /api/users/:userId - Hämta en användare med ID
router.get('/:id', async (req: Request<UserIdParam>, res: Response<UserRes | ErrorMessage>) => {
    try {
      const idParsed = validateId(req.params.id)
       if (!idParsed.success) return res.status(400).send({ error: 'Invalid id' })

      const newId = idParsed.data; 

      const result = await db.send(new GetCommand({
        TableName: myTable,
        Key: { 
          Pk: 'user', 
          Sk: `user#${newId}` }
      }));

      if (!result.Item) return res.status(404).send({ error: 'User not found' }); 

      const validated = userSchema.safeParse(result.Item);
      if (!validated.success) {
        return res.status(500).send({ error: 'Invalid user data in database' });
      }

      res.status(200).send({ user: validated.data }); 

    } catch (err) {
      res.status(500).send({ error: 'Failed to fetch user' }); 
    }
});


// POST /api/users - create a new user { name }
router.post('/', async (req: Request<UserBody>, res: Response<UserRes | ErrorMessage>) => {
  try {
    const parsed = userPostSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).send({ error: 'Invalid body' })
    }
    const { username } = parsed.data 

    const newId: string = (Math.floor(Math.random()* 1000000) + 1).toString()

    const newUser = {
          Pk: 'user',
          Sk: `user#${newId}`,
          username,
    }
	const validated = userSchema.parse(newUser)
  
    await db.send(new PutCommand({
        TableName: myTable,
        Item: newUser,
      }))

      res.status(201).send({ user: validated }) 

    } catch (err) {
      res.status(500).send({ error: 'Failed to create user' }) 
    } 
})


export interface UpdateUserResponse {
  user: User;
}
// PUT /api/users/:id - update user's name
router.put('/:id', async (req: Request<PutUserParam, {}, UserBody>, res: Response<UpdateUserResponse | ErrorMessage>) => {

  try {
    const idParsed = validateId(req.params.id)
    if (!idParsed.success) return res.status(400).send({ error: 'Invalid id' })
   
    const id = idParsed.data;

    const parsed = userPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send({ error: 'Invalid body', issues: parsed.error.issues });
    }
    const { username } = parsed.data;

    const result = await db.send(new UpdateCommand({
      TableName: myTable,
      Key: { 
        Pk: 'user',
        Sk: `user#${id}`
      },
      UpdateExpression: 'SET username = :username', 
      ExpressionAttributeValues: { ':username': username },
      ConditionExpression: 'attribute_exists(Pk) AND attribute_exists(Sk)', 
      ReturnValues: 'ALL_NEW', 
    }))

    const validated = userSchema.safeParse(result.Attributes);
        if (!validated.success) {
          return res.status(500).send({ error: 'Invalid user data in database' });
        }

        return res.status(200).send({ user: validated.data }); 


    } catch (err) { 
    return res.status(500).send({ error: 'Failed to update user' }) 
  }
})


// DELETE - Ta bort användare med id
router.delete('/:id', async (req: Request<UserIdParam>, res: Response<UserRes | ErrorMessage>) => {
    const userId = req.params.id;

    try {
      const idParsed = validateId(req.params.id)
      if (!idParsed.success) return res.status(400).send({ error: 'Invalid id' })
      const parsedId = idParsed.data;

      const deleteResult = await db.send(
        new DeleteCommand({
          TableName: myTable,
          Key: { 
            Pk: 'user', 
            Sk: `user#${parsedId}` 
          },
          ReturnValues: 'ALL_OLD', 
        })
      );

      if (deleteResult.Attributes) {
        
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
      return res.status(500).send({ error: `Could not delete user ${userId}` });
    }

});

export default router