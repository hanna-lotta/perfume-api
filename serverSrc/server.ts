import 'dotenv/config'
import express from 'express'
import type { Express, RequestHandler } from 'express'
import cors from 'cors'
import productRouter from './data/routes/products.js'

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