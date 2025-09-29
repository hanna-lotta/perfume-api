import 'dotenv/config' // Läser din .env-fil och gör variablerna tillgängliga i process.env
import express from 'express'
import type { Express, RequestHandler } from 'express'
import cors from 'cors'
import productRouter from './routes/products.js'
import cartRouter from './routes/cart.js'
import usersRouter from './routes/user.js'

// ✅ default to 1444 if .env is missing
const port = Number(process.env.PORT)
const app: Express = express()

const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.url} ${JSON.stringify(req.query)}`)
  next()
}

app.use(express.json())
app.use('/', logger)
app.use(cors())
app.use(express.static('./dist/'))
app.use('/api/products', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/users', usersRouter)


app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})