import 'dotenv/config'
import express, { type Express, type RequestHandler } from 'express'
import cors from 'cors'
import userRouter from './data/users.js' // use .js because ESM/NodeNext

const port = Number(process.env.PORT) || 3000
const app: Express = express()

const logger: RequestHandler = (req, _res, next) => {
  console.log(`${req.method} ${req.url} ${JSON.stringify(req.body)}`)
  next()
}

app.use(express.json())
app.use(logger)
app.use(cors())

// root
app.get('/', (_req, res) => {
  res.send('API is running !!!')
})

// routers
app.use('/api/users', userRouter)

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
