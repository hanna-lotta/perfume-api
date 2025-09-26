import { Router } from 'express'

type User = { id: string; name: string; email: string }

const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
]

const router = Router()

// GET /api/users
router.get('/', (_req, res) => {
  res.json(users)
})

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

export default router
