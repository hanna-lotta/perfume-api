import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Cart from './pages/CartPage.tsx'
import User from './pages/User.tsx'

const router = createHashRouter([
  {
    path: '/',
	Component: App,
	children: [
		{
			index: true,
			Component: Home
		},
		{
			path: '/cart',
			Component: Cart
		},
		{
			path: '/user',
			Component: User
		}
	]
}
])


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
