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
-GET /api/products - get all products 
-GET /api/products/:id- get spec product based by id
-POST /api/products - add new product
-PUT /api/products - change either, amount, name, price 
-DELETE /api/products -remove product

CART
-GET /api/cart - get all products
-GET /api/cart/user/user1 - get specific product baser by user
-POS /api/cart/productId- add new product
-PUT /api/cart/p123/user/user1 - change either, amount, name, price 
-DELETE /api/cart -remove product

USER:
-GET /api/user
-GET /api/user/userId
-POST /api/user
-PUT /api/user
-DELETE /api/user

An example:
```
PUT http://localhost:1444/api/cart/p123/user/user1
{"amount": 3}

