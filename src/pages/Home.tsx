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
					</div>
				)}
			</div>
		
	)
}
	  
export default Home