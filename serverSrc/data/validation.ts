import * as z from "zod"
import type { CartItem, ErrorMessage } from './types.js'

const CartSchema = z.object({
  userId: z.string().min(1).max(50),
  productId: z.string().regex(/^p\d+$/), 
  amount: z.number().int().min(1).max(10),
})

function isCartItem(item: CartItem | undefined): item is CartItem {
	try {
		let result = CartSchema.parse(item)
		return true
	} catch {
		return false
	}
}

export const productsPostSchema = z.object ({
	name: z.string().min(1).max(25),
	price: z.number().gte(1),
	img: z.string().min(5).max(300),
	amountInStock: z.number().gte(0)
})

const NewCartSchema = z.object({
  userId: z.string().min(5).max(8),
  productId: z.string().regex(/^p\d+$/), 
  amount: z.number().int().min(1).max(10),
})

export { CartSchema, isCartItem, NewCartSchema }