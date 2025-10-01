export type GetResult = Record<string, any> | undefined

export type MovieIdParam = {
	movieId: string;
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
	Pk: string,
	Sk: string,
	userId: string,
	productId: string, 
	amount: number

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
