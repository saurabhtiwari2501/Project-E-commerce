const productModel = require("../models/productModel");
const mongoose = require("mongoose")
const validator = require("../validator/validation")
const { uploadFile } = require("../aws/awsConnect")
const jwt = require("jsonwebtoken");



const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        var isValid = mongoose.Types.ObjectId.isValid(productId)
        if (!isValid) return res.status(400).send({ status: false, message: "Enter Valid Id" })


        let data = req.body
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = data
        let productImage = req.files

        
        if (!(productImage || validator.isValidRequest(data))) return res.status(400).send({ status: false, message: "Enter User Details To Update " }) 

        if (title || title === "") {
            if (!validator.isValid(title))
                return res.status(400).send({ status: false, message: "Title Is Required " }) 

            if (!validator.isValidTitle(title))
                return res.status(400).send({ status: false, message: "Enter Valid title " })

            let title1 = await productModel.find({ title: title })
            if (title1.length > 0) return res.status(400).send({ status: false, message: "Title Is Already Exist" })

        }

        if (description || description === "") {
            if (!validator.isValid(description))
                return res.status(400).send({ status: false, message: "Description Is Required " }) 

            if (!validator.isValidStreet(description))
                return res.status(400).send({ status: false, message: "Enter Valid Description " })
        }

     
        if (price || price === "") {
            if (!validator.isValidNumbers(price))
                return res.status(400).send({ status: false, message: "Price Is Required And Must Be In Numbers" }) 
            if (!validator.isValidPrice(price))
                return res.status(400).send({ status: false, message: "Enter Valid Price" })
        }

        if (currencyId || currencyId === "") {
            if (!validator.isValid(currencyId)) return res.status(400).send({ status: false, message: "Currency Id is Required " })
            if (currencyId !== "INR") return res.status(400).send({ status: false, message: "Currency Id Must Be INR" })
        }

    
        if (currencyFormat || currencyFormat === "") {
            if (!validator.isValid(currencyFormat)) return res.status(400).send({ status: false, message: "currency Format Is Required " })
            if (currencyFormat !== "₹") return res.status(400).send({ status: false, message: "Currency Format Must Be ₹" })
        }

        
        if (isFreeShipping || isFreeShipping === "") {
            if (isFreeShipping === "") return res.status(400).send({ status: false, message: " isFreeShipping Is Required " })
            if (!validator.isBoolean(isFreeShipping)) return res.status(400).send({ status: false, message: "IsFreeShipping Must Be Boolean value" })
        }

      
        if (style || style === "") {
            if (!validator.isValid(style))
                return res.status(400).send({ status: false, message: "Style Is Required " }) 

            if (!validator.isValidName(style))
                return res.status(400).send({ status: false, message: "Enter Valid style" })
        }

       
        if (productImage.length) {
            if (!productImage.length) return res.status(400).send({ status: false, message: " Please Provide The Product Image" });
            if (!validator.isValidImage(productImage[0].originalname)) return res.status(400).send({ status: false, message: "Give valid Image File" })

            let uploadedProfileImage = await uploadFile(productImage[0])
            data.productImage = uploadedProfileImage
        }

     
        if (availableSizes || availableSizes === "") {
            if (availableSizes === "") return res.status(400).send({ status: false, message: "Enter atleast One Size" })
            if (!validator.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: "Enter Valid Size" })
            data.availableSizes = availableSizes.toUpperCase().split(",").map(x => x.trim())

        }

        
        if (installments || installments === "") {
            if (!validator.isValidNumbers(installments))
                return res.status(400).send({ status: false, message: "Installment Is Required And Must Be In Numbers" })
            if (!validator.isValidPrice(installments))
                return res.status(400).send({ status: false, message: "Enter installment" })
        }


       
        if (isDeleted || isDeleted === "") {
             if (!validator.isBoolean(isDeleted))
                return res.status(400).send({ status: false, message: "isDeleted Must Be A Boolean Value" })
        }

        let updateData = await productModel.findByIdAndUpdate({ _id: productId, isDeleted: false }, data, { new: true })
        if (!updateData) return res.status(404).send({ status: true, message: "Product Not Found" })
        return res.status(200).send({ status: true, message: "Updated  Successfully", data: updateData })

    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}


module.exports={updateProduct}