import 'dotenv/config' // Läser din .env-fil och gör variablerna tillgängliga i process.env
import express from 'express'
import type { Express, RequestHandler } from 'express'
import cors from 'cors'
import productRouter from './routes/products.js'
import cartRouter from './routes/cart.js'

const port = Number(process.env.PORT)
const app: Express = express()

const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.url} ${req.body}`)
  next()
}

app.use(express.json())
app.use('/', logger)
app.use(cors())
app.use(express.static('./dist/'))
app.use('/api/products', productRouter)



app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})