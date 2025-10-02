import type { Product } from "../types"
import { useState, useEffect } from 'react'

const Home = () => {
	const [products, setProducts] = useState<Product[]>([])

	const handleGetProducts = async () => {
		try {
			const response = await fetch('/api/products')
			if (!response.ok) {
				console.error('Server error:', response.status)
				return
			}
			const data = await response.json()
			setProducts(data)
		} catch (error) {
			console.error('Fetch error:', error)
		}
	}


	// Funktion för att lägga till i cart
	const handleAddToCart = async (productId: string, userId: string = 'user1', amount: number = 1) => {
		try {
			const response = await fetch('/api/cart', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					productId,
					userId,
					amount
				})
			})
			if (!response.ok) {
				console.error('Server error:', response.status)
				const errorData = await response.text()
				console.error('Error details:', errorData)
				return
			}
			const result = await response.json()
			console.log('Cart item added:', result)
			
		} catch (error) {
			console.error('Fetch error:', error)
		}
	}

	useEffect(() => {
		handleGetProducts()
	}, [])

	return (
			<div className="products-grid">
				{products.map((product: Product) => 
					<div className='product-card' key={product.Sk}>
						<h3>{product.name}</h3>
						<img src={product.img} />
						<p>{product.price} kr</p>
						<p> ✔️ {product.amountInStock} i lager</p>
						<button 
							className="add-to-cart-btn"
							onClick={() => handleAddToCart('p' + product.Sk.split('#')[1])}
						>
							Lägg till i cart
						</button>
					</div>
				)}
			</div>
		
	)
}
	  
export default Home