const express = require("express")
const router = express.Router()
const  {createUser,loginUser, getUserDetails, updateUser}= require ("../controller/userController")
const { authentication,authorise } = require("../middleware/auth")
const {createProduct, updateProduct,getProductsById,delProductsById,getProducts}= require("../controller/ProductConrollers")
const {cart,updatecart,getCart,deletecart} = require('../controller/cartController')
const {createOrder,updateOrder} = require('../controller/orderController')



//---------------------------------PHASE 1----------------------//
router.post("/register",createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile",authentication,getUserDetails);
router.put("/user/:userId/profile",authentication,authorise,updateUser)
//---------------------------------PHASE 2----------------------//
router.post("/products",createProduct)
router.put("/products/:productId",updateProduct)
router.get('/products',getProducts)
router.get('/products/:productId',getProductsById)
router.delete('/products/:productId',delProductsById)
//---------------------------------PHASE 3----------------------//
router.post('/users/:userId/cart',authentication,authorise,cart)
router.put('/users/:userId/cart',authentication,authorise,updatecart)
router.get('/users/:userId/cart',authentication,authorise,getCart)
router.delete('/users/:userId/cart',authentication,authorise,deletecart)
//---------------------------------------------------------------------------------------------------------------------------------------------
router.post('/users/:userId/orders',authentication,authorise,createOrder)
router.put('/users/:userId/orders',authentication,authorise,updateOrder)



module.exports = router