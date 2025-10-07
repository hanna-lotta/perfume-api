
export interface Product {
	
	Pk: 'product',
	Sk: `p#${string}`,
	name: string,
	price: number,
	img: string,
	amountInStock: number
}
export interface CartItem {
	Pk: 'cart',
	Sk: string,
	userId: string,
	productId: string, 
	amount: number
}