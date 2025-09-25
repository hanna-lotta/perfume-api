import * as z from "zod"


export const CartSchema = z.object({
  id: z.string(),
  userId: z.string().min(1).max(50),
  productId: z.string().regex(/^p\d+$/), 
  amount: z.number().int().min(1).max(10),
})
