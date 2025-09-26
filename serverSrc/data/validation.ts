import * as z from "zod"
import type { CartItem, ErrorMessage } from './types.js'


const CartSchema = z.object({
  id: z.string(),
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

export { CartSchema, isCartItem}