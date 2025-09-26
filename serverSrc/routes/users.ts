import express, { type Request, type Response, type Router } from 'express'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import db, { myTable } from '../data/dynamodb.js'

const router: Router = express.Router()

// GET /api/users -> Return all user lists from DynamoDB.
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
      return {
        id: sk.replace(/^u#/, ''),
        name,
      }
    })

    res.status(200).json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

export default router
