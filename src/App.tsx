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
	/*
	const handleAddProduct = async (productData: any) => {
		const uniqueId = crypto.randomUUID()
		const response = await fetch(`/api/products/${uniqueId}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(productData)
		})
		
		if (response.ok) {
			const newProduct = await response.json()
			setProducts(prev => [...prev, newProduct]) // Lägg till utan reload
		}
	}*/

	

	useEffect(() => {
		handleGetProducts()
	}, [])

  return (
    <div>
		<h1>Parfymer</h1>
		<div>
			<input type="text" 
			placeholder="Sök parfym..." />
		</div>
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
	</div>
  )
}

export default App
