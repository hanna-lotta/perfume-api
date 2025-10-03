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
	issuess?: unknown;
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
