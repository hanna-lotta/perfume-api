import { useEffect, useState } from "react"
import type { CartItem } from "../types"

const CartPage = () => {
	const [isCartItem, SetIsCartItem] = useState(false)
	const [cartItem, SetCartItem] = useState<CartItem[]>([]) 

	useEffect(() => {
        handleGetCartItems('user1')
    }, [])

	const handleGetCartItems = async (userId: string = 'user1') => {
		try {
			const response = await fetch(`/api/cart/user/${userId}`)
			if (!response.ok) {
				console.error('Server error:', response.status)
				return
			}
			const data = await response.json()
			console.log('Cart data from backend:', data)
			console.log('Each cart item:', data.map((item: any) => ({
				Sk: item.Sk,
				productId: item.productId,
				userId: item.userId,
				amount: item.amount
			})))
			if (data.length > 0) {
				SetIsCartItem(true)
				SetCartItem(data)
			} else {
				SetIsCartItem(false)
				console.log('No cart items found')
			}
		} catch (error) {
			console.error('Fetch error:', error)
		}
	}


	const handleRemove = async (id: string) => {
		try {
			const response = await fetch(`/api/cart/${id}`, {
				method: 'DELETE',
			})
			if (!response.ok) {
				console.error('Server error:', response.status)
				return
			}
			// Ta bort varan från cartItem state
			SetCartItem(prevItems => prevItems.filter(item => item.id !== id))
			if (cartItem.length === 1) {
				SetIsCartItem(false)
			}
		} catch (error) {
			console.error('Fetch error:', error)
		}
	}

	  return (
		<div>
		  <h1>Cart Page</h1>
		  <div className="cart-frame">
			{isCartItem ? (
				<div>
				{cartItem.map((item) => (
					
					<div key={item.id} className="cart-item">
					 
					  <div className="cart-item-details">
						<p>{item.name}</p>
						<p>{item.price} kr</p>
						<p>Antal: {item.amount}</p>
						
					  </div>
					  <button className="remove-button" onClick={() => {handleRemove(item.id)}}>Ta bort</button>
					</div>
				  ))}
				  <div className="cart-summary">
					
					<button className="checkout-button">Gå till kassan</button>
				  </div>
				</div>
				
			) : (
				<p className="cart">Kundvagnen är tom...</p>
			)}
		
			
		  </div>
		</div>
	  )
	}
	  
	export default CartPage