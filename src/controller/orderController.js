const validation = require("../validation/validation")
const orderModel = require("../models/orderModel")
const userModel = require("../models/userModel")
const cartModel = require("../models/cartModel")

const { isValid, isValidObjectId } = require("../validation/validation");

const createOrder = async function (req, res) {
   try {
        let userId = req.params.userId

        if (!userId) return res.status(400).send({ status: false, message: "userId is required" })
        if (isValid(userId)) return res.status(400).send({ status: false, message: "Incorrect userId" })
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Incorrect userId" })
        
        let user = await userModel.findById(userId)
      
        if (!user) return res.status(404).send({ status: false, message: "user not found" })
        
        let data = req.body

        let { cancellable, cartId } = data
        data.userId=userId
        if (!cartId) {
            return res.status(400).send({ status: false, message: "please provide a cartId" })
        }

        if (isValid(cartId)) return res.status(400).send({ status: false, message: "Incorrect cartId" })
        
        const checkCart = await cartModel.findById(cartId)
        if (!checkCart) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }

       
        if (userId != checkCart.userId) return res.status(403).send({ status: false, message: "Not Authorised to update this order" })

        if (checkCart.items.length === 0) return res.status(400).send({ status: false, message: "Cart is empty cannot place an order!" })

         const checkorder = await orderModel.findOne({ userId: userId, isDeleted: false, status: "pending" })
         if (checkorder) {
             return res.status(400).send({ status: false, message: `order(${checkorder._id}) is pending for the given cart` })
         }

        let orderData = checkCart.toObject()
        delete orderData["_id"]

        orderData["totalQuantity"] = 0

        let itemsArr = checkCart.items
        for (i = 0; i < itemsArr.length; i++) {
            orderData.totalQuantity += itemsArr[i].quantity
        }

        if (cancellable != undefined) {
            if (!(cancellable == "true" || cancellable == "false"))
                return res.status(400).send({ status: false, message: "cancellable should be Boolean or true/false" })
            orderData["cancellable"] = cancellable
        }

        checkCart.items = []
        checkCart.totalPrice = 0
        checkCart.totalItems = 0
        checkCart.save()

        const order = await orderModel.create(orderData)
        return res.status(201).send({ status: true, message: "Success", data: order })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
   }
}

const updateOrder = async (req, res) => {
    try {
        let data = req.body;

    
        if (validation.isValid(data)) return res.status(400).send({ status: false, message: 'Data is required to cancel your order' });
        
        if (validation.isValid(data.orderId)) return res.status(400).send({ status: false, message: 'OrderId is required and should not be an empty string' });
        if (!validation.isValidisValidObjectId(data.orderId)) return res.status(400).send({ status: false, message: 'Enter a valid order-Id' });

        let findOrder = await orderModel.findOne({ _id: data.orderId, isDeleted: false });
        if (!findOrder) return res.status(404).send({ status: false, message: `No order found with this '${data.orderId}' order-ID` })

        if (validation.isValid(data.status)) return res.status(400).send({ status: false, message: 'Status is required and should not be an empty string' });

        if (!(['Pending', 'Completed', 'Cancelled'].includes(data.status))) return res.status(400).send({ status: false, message: "Order status should be one of this 'Pending','Completed' and 'Cancelled'" });

        let conditions = {};

        if (data.status == "Cancelled") {
          
            if (!findOrder.cancellable) return res.status(400).send({ status: false, message: "You cannot cancel this order" });
            conditions.status = data.status;
        } else {
            conditions.status = data.status;
        }

        let resData = await orderModel.findByIdAndUpdate({ _id: findOrder._id },conditions,{ new: true }
        )
        res.status(200).send({ status: true, message: "Success", data: resData });
    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = { createOrder,updateOrder }