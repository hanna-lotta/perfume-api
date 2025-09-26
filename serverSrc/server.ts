import 'dotenv/config' 
import express, { type Express, type RequestHandler } from 'express'
import cors from 'cors'
import usersRouter from './routes/users.js'

const port = Number(process.env.PORT ?? 3000)
const app: Express = express()

const logger: RequestHandler = (req, _res, next) => {
  console.log(`${req.method} ${req.url} ${JSON.stringify(req.query)}`)
  next()
}

app.use(cors())
app.use(express.json())
app.use(logger)
app.use(express.static('./dist/'))

// Routes
app.use('/api/users', usersRouter)

// check endpoint
app.get('/check', (_req, res) => res.status(200).send('ok'))

/*
// error handler (optional)
app.use((err: unknown, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})
*/

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
