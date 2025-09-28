import express, { type Request, type Response, type Router } from 'express'
import { QueryCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import db, { myTable } from '../data/dynamodb.js'
import { userPostSchema } from '../data/validation.js'

const router: Router = express.Router()

// GET /api/users -> get all users from DynamoDB
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: 'Pk = :pk',
        ExpressionAttributeValues: { ':pk': 'user' },
      })
    )

    const items = (result.Items ?? []) as Array<Record<string, unknown>>
    const users = items.map((it) => {
      const sk = String(it['Sk'] ?? '')
      const name = String(it['name'] ?? '')
      return { id: sk.replace(/^u#/, ''), name }
    })

    res.status(200).json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// POST /api/users -> create a new user { name }
router.post('/', async (req: Request, res: Response) => {
  try {
    // validate body
    const parsed = userPostSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues })
    }
    const { name } = parsed.data

    // create id
    const id = (globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36))

    // save user (allow overwrite if the same key exists)
    await db.send(
      new PutCommand({
        TableName: myTable,
        Item: {
          Pk: 'user',
          Sk: `u#${id}`,
          name,
        },
      })
    )

    // respond
    res.status(201).location(`/api/users/${id}`).json({ id, name })
  } catch (err: unknown) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// GET /api/users/:id -> get one user by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id

    const result = await db.send(
      new GetCommand({
        TableName: myTable,
        Key: { Pk: 'user', Sk: `u#${id}` },
      })
    )

    const item = result.Item as Record<string, unknown> | undefined
    if (!item) {
      return res.status(404).json({ error: 'User not found' })
    }

    const name = String(item['name'] ?? '')
    return res.status(200).json({ id, name })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

export default router
