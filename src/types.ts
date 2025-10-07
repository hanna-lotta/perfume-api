// Frontend types för React komponenter

export interface Product {
  Pk: 'product';
  Sk: string;
  name: string;
  price: number;
  img: string;
  amountInStock: number;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  // För UI - vi kommer hämta produktinfo och lägga till:
  name?: string;
  img?: string;
  price?: number;
}

export interface User {
  id: string;
  name: string;
}

export interface ErrorMessage {
  error: string;
}