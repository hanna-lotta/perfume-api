export type GetResult = Record<string, any> | undefined

export type ProductIdParam = {
	productId: string;
};

export interface Product {
	
	Pk: 'product',
	Sk: `p#${string}`,
	name: string,
	price: number,
	img: string,
	amountInStock: number
}

export interface ErrorMessage {
	error: string;
}

export interface CartItem {
	Pk: 'cart',
	Sk: string,
	userId: string,
	productId: string, 
	amount: number
}

export interface User {
  Pk: 'user'
  Sk: `user#${string}`
  username: string;
}

export interface UserIdParam {
	userId: string;
}

export interface PutUserParam {
	id: string;
}

export interface UserRes {
  user: User;
}

export interface GetUsersRes {
	users: User[];
}

export interface Cart {
  Pk: 'cart'
  Sk: `product#${string}#user#${string}`
  amount: number
}

// NEW: PUT user - allow optional 'issues' for zod details
export interface ErrorMessage {
  error: string;
  issues?: unknown; 
}