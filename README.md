-Perfume API

This is a smaller API for perfumes with React frontend.

In this API there is:

-API for perfumes, cart and user.
-Backend: Express, TypeScript, DynamoDB.
-Some Frontend: React, Vite.
-Validation by zod.


-API: http://localhost:1444
-Frontend: http://localhost:5173
 

API endpoints

PRODUCTS
-GET /api/products/ - all products 
-GET /api/products/:productId- get specific product 
-POST /api/products/ - create new product
-PUT /api/products/:productId - update product 
-DELETE /api/products/:productId -remove product

CART
-GET /api/cart/ - get all cart items
-GET /api/cart/user/:userId - get specific cart for sepecific user
-POST /api/cart/ - create new cart item
-PUT /api/cart/:productId/user/:userId - update cart amount 
-DELETE /api/cart/productId/user/:userId -remove specific product from users cart

USER:
-GET /api/users/ - all users
-GET /api/users/:userId - specific user
-POST /api/users/ - create user  
-PUT /api/users/:userId -update username
-DELETE /api/users/:userId - remove user

An example :
```
PUT http://localhost:1444/api/cart/p123/user/user1

body: {"amount": 3}


Created by Hanna, Julia, Photsathon, Shweta and Sara.

