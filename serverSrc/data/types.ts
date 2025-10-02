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
	error: string
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
  Sk: `u#${string}`
  id: string;
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
