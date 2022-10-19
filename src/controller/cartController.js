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
    if (!isUser) return res.status(404).send({ status: false, message: "user Does not exists" })

    if (!validate.isValidRequest(data))
        return res.status(400).send({ status: false, msg: "Enter Cart Details" })

    if (!cartId) {
        let isCart = await cartModel.findOne({ userId: userId })
        if (isCart) return res.status(400).send({ status: false, message: "Enter the Cart Id" })
        if (!productId) return res.status(400).send({ status: false, message: "Enter the Product Id" })

        var isValid = mongoose.Types.ObjectId.isValid(productId)
        if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Product Id" })

        var isProduct = await productModel.findOne({ isDeleted: false, _id: productId })
        if (!isProduct) return res.status(404).send({ status: false, message: "Product does not exists" })

        let items = [{ productId: productId, quantity: 1 }];

        let dataAdded = { items: items, totalPrice: isProduct.price, totalItems: 1, userId: userId }
        let saveData = await cartModel.create(dataAdded)
        res.status(201).send({ status: true, message: "New Cart created and added the desired product", data: saveData })
    }
    else {
        var isValid = mongoose.Types.ObjectId.isValid(cartId)
        if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Cart Id" })

        let iscart = await cartModel.findById(cartId)
        if (!iscart) return res.status(404).send({ status: false, message: "Cart does not exists" })

        let UserIdIncart = iscart.userId.toString()
        if (UserIdIncart != userId) return res.status(403).send({ status: false, message: "Entered UserId does not match with the user Id in cart" })

        if (!productId) return res.status(400).send({ status: false, message: "Enter the Product Id" })

        var isValid = mongoose.Types.ObjectId.isValid(productId)
        if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Product Id" })

        var isProduct = await productModel.findOne({ isDeleted: false, _id: productId })
        if (!isProduct) return res.status(404).send({ status: false, message: "Product does not exists" })

        let totalPrice = isProduct.price + iscart.totalPrice
        let totalItems = iscart.totalItems
        let items = iscart.items

        for (let i = 0; i < items.length; i++) {
            if (items[i].productId.toString() == productId) {
                iscart.items[i].quantity += 1;
                iscart.totalPrice = totalPrice

                iscart.save()
                return res.status(200).send({ status: true, message:"Success", data: iscart })
            }
        }
        let newArray = [{ productId: productId, quantity: 1 }]
        items = [...items, ...newArray]
        let obj = { totalPrice: totalPrice, totalItems: totalItems + 1, userId: userId, items: items }
        let dataToBeAdded = await cartModel.findOneAndUpdate({ _id: cartId }, obj, { new: true })
        res.status(200).send({ status: true, message:"Success", data: dataToBeAdded })
    }
}
    catch (err) {return res.status(500).send({status:false , message:err.message})}
}

module.exports={cart}