

import { NavLink, Outlet } from 'react-router-dom'

import './App.css'

function App() {


  return (
	<>
	<header className="header">
		<h1>Parfymer</h1>
		<nav className="links">
			<NavLink to="/">Produkter</NavLink>
			<NavLink to="/cart">Kundvagn</NavLink>
			<NavLink to="/user">Användare</NavLink>
		</nav>
	</header>
	<main>
		<Outlet />
	</main>
   
	</>
  )
}

export default App
