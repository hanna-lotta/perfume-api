export type GetResult = Record<string, any> | undefined

export type MovieIdParam = {
	movieId: string;
};

export interface Product {
	productId: string,
	pk: 'product',
	name: string,
	price: number,
	img: string,
	amountinstock: number
} 

export interface ErrorMessage {
	error: string
}