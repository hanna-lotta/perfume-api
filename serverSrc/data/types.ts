export type GetResult = Record<string, unknown> | undefined

export interface Product {
  Pk: 'product'
  Sk: `p#${string}`
  name: string
  price: number
  img: string
  amountInStock: number
}

export interface User {
  Pk: 'user'
  Sk: `u#${string}`
  name: string
}

export interface Cart {
  Pk: 'cart'
  Sk: `product#${string}#user#${string}`
  amount: number
}

export interface ErrorMessage {
  error: string
}
