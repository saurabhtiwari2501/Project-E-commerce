const express = require("express");
const router = express.Router();
const  {createUser,loginUser, getUserDetails, updateUser}= require ("../controller/userController");
const { authentication } = require("../middleware/auth");
const {createProduct, updateProduct,getProductsById,delProductsById,getProducts}= require("../controller/ProductConrollers")
const {cart} = require('../controller/cartController')



//---------------------------------PHASE 1----------------------//
router.post("/register",createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", authentication, getUserDetails);
router.put("/user/:userId/profile", authentication, updateUser)
//---------------------------------PHASE 2----------------------//
router.post("/createproducts",createProduct)
router.put("/updateproducts/:productId",updateProduct)
router.get('/products',getProducts)
router.get('/products/:productId',getProductsById)
router.delete('/products/:productId',delProductsById)
//---------------------------------PHASE 2----------------------//
router.post('/users/:userId/cart',authentication,cart)



module.exports = router