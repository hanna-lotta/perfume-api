import type { Product } from './types'
import { useState, useEffect } from 'react'

import './App.css'

function App() {

	const [products, setProducts] = useState<Product[]>([])

	const handleGetProducts = async () => {
		const response = await fetch('/api/products')
		const data = await response.json()
		setProducts(data)
	}

	
	useEffect(() => {
		handleGetProducts()
	}, [])

  return (
    <div>
		<h1>Parfymer</h1>
		<div className="products-grid">
			{products.map((product: Product) => 
				<div className='product-card' key={product.Sk}>
					<h3>{product.name}</h3>
					<p>{product.price} kr</p>
					<p> ✔️ {product.amountInStock} i lager</p>
				</div>
			)}
		</div>
	</div>
  )
}

export default App
