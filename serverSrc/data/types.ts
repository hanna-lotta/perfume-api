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
	userId: string,
	productId: string, 
	amount: number

}