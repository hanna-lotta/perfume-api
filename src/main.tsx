import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Cart from './pages/CartPage.tsx'
import Users from './pages/Users.tsx'

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
			path: '/users',
			Component: Users
		}
	]
}
])


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
