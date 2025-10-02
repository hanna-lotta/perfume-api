import * as z from "zod"
import type { CartItem } from './types.js'

export const CartSchema = z.object({
  userId: z.string().min(1).max(50),
  productId: z.string().regex(/^p\d+$/), 
  amount: z.number().int().min(1).max(10),
  Pk: z.literal('cart'),
  Sk: z.string().regex(/^product#p\d+#user#.+$/)
})

export function isCartItem(item: CartItem | undefined): item is CartItem {
	try {
		let result = CartSchema.parse(item)
		return true
	} catch {
		return false
	}
}

export const ProductSchema = z.object({
	Pk: z.literal('product'),    // Pk ska vara product
	Sk: z.string().regex(/^p[0-9]+$/), // Sk ska vara p + nr
	name: z.string().min(1).max(30),     //Max 30 bokstäver
	price: z.number().gte(1).lte(1000000), // Max 1 miljon
	img: z.string().max(300).refine(
		(val) => {
			try {
				new URL(val); // JavaScript's inbyggda URL-parser
				return true; // Om den inte kastar fel = giltig URL
			} catch {
				return false; // Om den kastar fel = ogiltig URL
			}
		},
		{ message: "Invalid URL format" }
	),
	amountInStock: z.number().int().gte(0) //heltal , större än 0
})




 //Schema utan pk och sk till POST - användaren skickar bara produktdata
 export const productsPostSchema = z.object ({
	name: z.string().min(1).max(25),
	price: z.number().gte(1).lte(1000000),
	img: z.string().max(300).refine(
		(val) => {
			try {
				new URL(val);
				return true;
			} catch {
				return false;
			}
		},
		{ message: "Invalid URL format" }
	),
	amountInStock: z.number().int().gte(0)
})

export const NewCartSchema = z.object({
  userId: z.string().min(5).max(8),
  productId: z.string().regex(/^p\d+$/), 
  amount: z.number().int().min(1).max(10),
})

export const userPostSchema = z.object ({
	username: z.string().min(1).max(50)
})



