const cartModel = require("../models/cartModel")
const mongoose = require('mongoose')
const validate = require("../validation/validation")
const jwt = require("jsonwebtoken");
const productModel = require("../models/productModel")
const userModel = require("../models/userModel");



const cart = async function (req, res) {
    try{
    let userId = req.params.userId
    let data = req.body
    let { productId, cartId } = data

    var isValid = mongoose.Types.ObjectId.isValid(userId)
    if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid User Id" })

    let isUser = await userModel.findById(userId)
    if (!isUser) return res.status(404).send({ status: false, message: "user not found" })

    if (!validate.isValidRequest(data))
        return res.status(400).send({ status: false, msg: "Enter Cart Details" })

    if (!cartId) {
        let cart = await cartModel.findOne({ userId: userId })
        if (cart) return res.status(400).send({ status: false, message: "Enter the Cart Id" })
        if (!productId) return res.status(400).send({ status: false, message: "Enter the Product Id" })

        var isValid = mongoose.Types.ObjectId.isValid(productId)
        if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Product Id" })

        var product = await productModel.findOne({_id: productId , isDeleted: false, })
        if (!product) return res.status(404).send({ status: false, message: "Product not found" })

        let items = [{ productId: productId, quantity: 1 }]

        let dataAdded = { items: items, totalPrice: product.price, totalItems: 1, userId: userId }
        let saveData = await cartModel.create(dataAdded)
        res.status(201).send({ status: true, message: "Product has been added to the Cart", data: saveData })
    }
    else {
        var isValid = mongoose.Types.ObjectId.isValid(cartId)
        if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Cart Id" })

        let cart = await cartModel.findById(cartId)
        if (!cart) return res.status(404).send({ status: false, message: "Cart not found" })

        let UserIdn = cart.userId.toString()
        if (UserIdn != userId) return res.status(403).send({ status: false, message: "Wrong user Id" })

        if (!productId) return res.status(400).send({ status: false, message: "Enter the Product Id" })

        var isValid = mongoose.Types.ObjectId.isValid(productId)
        if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Product Id" })

        var product = await productModel.findOne({ isDeleted: false, _id: productId })
        if (!product) return res.status(404).send({ status: false, message: "Product not found" })
    

        let totalPrice = product.price + cart.totalPrice
        let items = cart.items
        let totalItems = cart.totalItems
    if(items.quantity<1){
        return res.status(400).send({ status: false, message:"Your Card is Empty"})
    }
    

    for (let i = 0; i < items.length; i++) {
        if (items[i].productId.toString() == productId) {
            cart.items[i].quantity += 1;
            cart.totalPrice = totalPrice

            cart.save()
            return res.status(201).send({ status: true, message:"Success", data: cart })
        }
    }
    let newArray = [{ productId: productId, quantity: 1 }]
    items = [...items, ...newArray]

    let obj = { totalPrice: totalPrice, totalItems: totalItems + 1, userId: userId, items: items }
        let updatedData = await cartModel.findOneAndUpdate({ _id: cartId }, obj, { new: true })

        res.status(200).send({ status: true, message:"Success", data: updatedData })
        }
}
    catch (err) {return res.status(500).send({status:false , message:err.message})}
}

const updatecart = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!userId) return res.status(400).send({ status: false, message: "userId is mandatory" })
        if (validate.isValid(userId)) return res.status(400).send({ status: false, message: "Incorrect userId" })
        if (!validate.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Incorrect userId" })

        const data = req.body
        if (!validate.isValidRequest(data)) {
            return res.status(400).send({ status: false, message: "plz enter some keys and values in the data" })
        }
        let { cartId, productId, removeProduct } = data

      
        if (!cartId) return res.status(400).send({ status: false, message: "cartId is mandatory" })
        if (validate.isValid(cartId)) return res.status(400).send({ status: false, message: "Incorrect cartId" })
        if (!validate.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Incorrect cartId" })

        
        if (!productId) return res.status(400).send({ status: false, message: "productId is mandatory" })
        if (validate.isValid(productId)) return res.status(400).send({ status: false, message: "Incorrect productId" })
        if (!validate.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Incorrect productId" })

        if (removeProduct == 0 || removeProduct == 1);
        else return res.status(400).send({ status: false, message: "please set removeProduct to 1 to decrease poduct quantity by 1, or set to 0 to remove product completely from the cart" })
        
        const foundcart = await cartModel.findById(cartId)
        if (!foundcart) return res.status(404).send({ status: false, message: "No products found in the cart" })

        let loggedInUser = req.verifyed.userId
        if (loggedInUser !== userId) return res.status(403).send({ status: false, message: "not authorized" })
        if (loggedInUser !== foundcart.userId.toString()) return res.status(403).send({ status: false, message: "not authorized to update this cart" })
     
        const foundUser = await userModel.findById(userId)
        if (!foundUser) return res.status(404).send({ status: false, message: "user not found for the given userId" })

        let foundProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!foundProduct) return res.status(404).send({ status: false, message: "Product not found for the given productId" })

        let itemsArr = foundcart.items
        let initialItems = itemsArr.length
        let totalPrice = foundcart.totalPrice
        let totalItems = foundcart.totalItems

        if (itemsArr.length === 0) return res.status(400).send({ status: false, message: "cart is empty nothing to delete" })

        if (removeProduct === 0) {
            for (let i = 0; i < itemsArr.length; i++) {
                if (productId == itemsArr[i].productId._id) {
                    totalPrice -= itemsArr[i].productId.price * itemsArr[i].quantity
                    totalItems--
                    itemsArr.splice(i, 1)
                }
            }
            if (initialItems === itemsArr.length) return res.status(404).send({ status: false, message: "product does not exist in the cart" })
        }

        if (removeProduct === 1) {
            initialItems = totalItems
            let flag = false
            for (let i = 0; i < itemsArr.length; i++) {
                if (productId == itemsArr[i].productId._id) {
                    flag = true
                    totalPrice -= foundProduct.price
                    itemsArr[i].quantity--
                    if (itemsArr[i].quantity == 0) {
                        totalItems--
                        itemsArr.splice(i, 1)
                    }
                }
            }
            if (!flag) return res.status(404).send({ status: false, message: "product does not exist in the cart" })
        }

        totalPrice = totalPrice.toFixed(2)
        const updatedcart = await cartModel.findOneAndUpdate({ _id: cartId }, ({ items: itemsArr, totalPrice: totalPrice, totalItems: totalItems }), { new: true }).select({ __v: 0 })

        if (!updatedcart) return res.status(404).send({ status: false, message: "cart not found" })

        return res.status(200).send({ status: true, message: "Success", data: updatedcart })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}

const getCart = async function (req, res) {
    try{
    let userId = req.params.userId
    let userData = await userModel.findById({ _id: userId })
    if (!userData) return res.status(404).send({ status: false, message: "No User Found" })
    let cartData = await cartModel.findOne({ userId: userId })
    if (!cartData) return res.status(404).send({ status: false, message: "Cart Not Found" })
    return res.status(200).send({ status: true, message: 'success', data: cartData })
}
    catch (err) {return res.status(500).send({status:false , message:err.message})}
}
  
  
  const deletecart = async function(req, res){
    try {
     const userId = req.params.userId
     const decodedToken = req.verifyed;
     
     if (!validate.isValidObjectId(userId))
       return res
         .status(400)
         .send({ status: false, message: "Please provide a valid userId." });
  
      if (userId !== decodedToken.userId)
        return res
          .status(401)
          .send({ status: false, message: "please login again." });
  
     
  
     let userExist = await userModel.findById( userId )
     if (!userExist) return res.status(404).send({ status: false, msg: "user not found" })
  
     let cartExist = await cartModel.findOne({userId : userId})
     if (!cartExist) return res.status(404).send({ status: false, msg: "cart not found" })
  
     const cartDeleted = await cartModel.findOneAndUpdate({userId : userId}, {item:[], totalPrice:0, totalItems:0}, {new: true})
     return res.status(204).send({ status: true, msg: "No Item in cart", data: cartDeleted })
  
    } catch (err) {
     return res.status(500).send({ status: false, message: err.message })
    }
  }


module.exports={cart,updatecart,getCart,deletecart}
