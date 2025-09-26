import * as z from "zod"


 export const productsPostSchema = z.object ({
	name: z.string().min(1).max(25),
	price: z.number().gte(1),
	img: z.string().min(5).max(300),
	amountInStock: z.number().gte(0)
})

export const userPostSchema = z.object ({
	name: z.string().min(1).max(50)
})