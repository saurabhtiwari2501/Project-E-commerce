const productModel = require("../models/productModel")
const {uploadFile} = require("../AWS/aws")
const validation = require("../validation/validation");
const mongoose = require('mongoose');




const createProduct = async function (req, res) {
    try {
        let data = req.body


        if (validation.isValidBody(data)) {
            return res.status(400).send({ status: false, message: "plz enter some keys and values in the data" })
        }

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = data

       
        if (title) {
            if (validation.isValid(title)) return res.status(400).send({ status: false, message: "title is in incorrect format" })
            let isUniqueTitle = await productModel.findOne({ title: title });
            if (isUniqueTitle) {
                return res.status(400).send({ status: false, message: "This title is being used already" })
            }
        } else return res.status(400).send({ status: false, message: "title must be present" })

 
        if (description) {
            if (validation.isValid(description)) return res.status(400).send({ status: false, message: "description is in incorrect format" })
        } else return res.status(400).send({ status: false, message: "description must be present" })
 
        if (!price || price == 0) return res.status(400).send({ status: false, message: "price cannot be empty" })
        if (!Number(price)) return res.status(400).send({ status: false, message: "price should be in valid number/decimal format" })
        data.price = Number(price).toFixed(2)
 
        if (currencyId && currencyId.trim().length !== 0) {
            if (currencyId !== "INR") return res.status(400).send({ status: false, message: "only indian currencyId is allowed and the type should be string" })
        } else return res.status(400).send({ status: false, message: "currencyId cannot be empty" })

   
        if (currencyFormat && currencyFormat.trim().length !== 0) {
            if (currencyFormat !== "₹") return res.status(400).send({ status: false, message: "only indian currencyFormat is allowed and the type should be string" })
        } else return res.status(400).send({ status: false, message: "currencyFormat cannot be empty" })
 
        if (isFreeShipping) {
            if (isFreeShipping == "true" || isFreeShipping == "false" || typeof isFreeShipping === "boolean") { }
            else return res.status(400).send({ status: false, message: "type should be Boolean or true/false" })
        }
 
        if (req.files) {
            let image = req.files[0]
            if (image) {
                 
                if (!(image.mimetype.startsWith("image"))) return res.status(400).send({ status: false, message: "only image files are allowed" })
                let url = await uploadFile(image)
                data.productImage = url
            } else return res.status(400).send({ status: false, message: "must include product image file" })
        } else return res.status(400).send({ status: false, message: "please upload product image file" })

       
        if (style) {
            if (validation.isValid(style))
                return res.status(400).send({ status: false, message: "style is in incorrect format" })
        }
 
        if (installments) {
            installments = parseInt(installments)
            if (!installments || typeof installments != "number")
                return res.status(400).send({ status: false, message: "installments should be of type number" })
        }
 
        if (availableSizes) {
            availableSizes = availableSizes.split(",").map(ele => ele.trim())
            if (Array.isArray(availableSizes)) {
                let enumArr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                let uniqueSizes = [...new Set(availableSizes)]
                for (let ele of uniqueSizes) {
                    if (enumArr.indexOf(ele) == -1) {
                        return res.status(400).send({ status: false, message: `'${ele}' is not a valid size, only these sizes are allowed [S, XS, M, X, L, XXL, XL]` })
                    }
                }
                data.availableSizes = uniqueSizes
            } else return res.status(400).send({ status: false, message: "availableSizes should be of type Array" })
        } else return res.status(400).send({ status: false, message: "please provide atleast one size" })

        if (isDeleted) {
            if (!(isDeleted == "true" || isDeleted == "false" || typeof isDeleted === "boolean"))
                return res.status(400).send({ status: false, message: "isDeleted should be Boolean or true/false" })
            if (isDeleted == true || isDeleted == "true") data.deletedAt = new Date
        }

        const createdProduct = await productModel.create(data)

        return res.status(201).send({ status: true, message: 'Success', data: createdProduct })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        var isValid = mongoose.Types.ObjectId.isValid(productId)
        if (!isValid) return res.status(400).send({ status: false, message: "Enter Valid Id" })


        let data = req.body
         let productImage = req.files

      
    if (!(productImage || validation.isValidRequest(data))) return res.status(400).send({ status: false, message: "Enter User Details To Update " }) 

     let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = data
       
        if (title || title === "") {
            if (validation.isValid(title))
                return res.status(400).send({ status: false, message: "Title Is Required " }) 
            if (!validation.isValidTitle(title))
                return res.status(400).send({ status: false, message: "Enter Valid title " })

            let title1 = await productModel.find({ title: title })
            if (title1.length) return res.status(400).send({ status: false, message: "Title Is Already Exist" })

        }

        if (description || description === "") {
            if (validation.isValid(description))
                return res.status(400).send({ status: false, message: "Description Is Required " }) 

            if (validation.isValid(description))
                return res.status(400).send({ status: false, message: "Enter Valid Description " })
        }

        if (price || price === "") {
            if (validation.isValidNumber(price))
                return res.status(400).send({ status: false, message: "Price Is Required And Must Be In Numbers" }) 
            if (!validation.isValidPrice(price))
                return res.status(400).send({ status: false, message: "Enter Valid Price" })
        }

       
        if (currencyId || currencyId === "") {
            if (validation.isValid(currencyId)) return res.status(400).send({ status: false, message: "Currency Id is Required " })
            if (currencyId !== "INR") return res.status(400).send({ status: false, message: "Currency Id Must Be INR" })
        }

    
        if (currencyFormat || currencyFormat === "") {
            if (validation.isValid(currencyFormat)) return res.status(400).send({ status: false, message: "currency Format Is Required " })
            if (currencyFormat !== "₹") return res.status(400).send({ status: false, message: "Currency Format Must Be ₹" })
        }

        if (isFreeShipping || isFreeShipping === "") {
            if (isFreeShipping === "") return res.status(400).send({ status: false, message: " isFreeShipping Is Required " })
            if (validation.isBoolean(isFreeShipping)) return res.status(400).send({ status: false, message: "IsFreeShipping Must Be Boolean value" })
        }

        if (style || style === "") {
            if (validation.isValid(style))
                return res.status(400).send({ status: false, message: "Style Is Required " }) 

            if (!validation.isValidName(style))
                return res.status(400).send({ status: false, message: "Enter Valid style" })
        }

        if (productImage.length) {
            if (!productImage.length) return res.status(400).send({ status: false, message: " Please Provide The Product Image" });
            if (!validation.isValidImage(productImage[0].originalname)) return res.status(400).send({ status: false, message: "Give valid Image File" })

            let uploadedProfileImage = await uploadFile(productImage[0])
            data.productImage = uploadedProfileImage
        }

      
        if (availableSizes || availableSizes === "") {
            if (availableSizes === "") return res.status(400).send({ status: false, message: "Enter atleast One Size" })
            if (validation.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: "Enter Valid Size" })
        
           
          data.availableSizes

        }

      
        if (installments || installments === "") {
            if (validation.isValidNumber(installments))
                return res.status(400).send({ status: false, message: "Installment Is Required And Must Be In Numbers" })
            if (!validation.isValidPrice(installments))
                return res.status(400).send({ status: false, message: "Enter installment" })
        }


      
        if (isDeleted || isDeleted === "") {
            if (isDeleted === "") return res.status(400).send({ status: false, message: " isDeleted Is Required " })
            if (validation.isBoolean(isDeleted))
                return res.status(400).send({ status: false, message: "isDeleted Must Be A Boolean Value" })
        }
         
         


        let updateData = await productModel.findByIdAndUpdate({ _id: productId, isDeleted: false }, data, { new: true })
        if (!updateData) return res.status(404).send({ status: true, message: "Product Not Found" })


      
        return res.status(200).send({ status: true, message: "Updated  Successfully", data: updateData })

    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}


const getProducts = async function (req, res) {
    try {
        let data = req.query
        let { size, name, priceLessThan, priceGreaterThan } = data
        let productData = { isDeleted: false }

        if (size) { productData.availableSizes = { $in: size.toUpperCase().split(",").map(x => x.trim()) } }
        if (priceLessThan && priceGreaterThan) { productData.price = { $gt: priceGreaterThan, $lt: priceLessThan } }
        if (priceLessThan && !priceGreaterThan) { productData.price = { $lt: priceLessThan } }
        if (priceGreaterThan && !priceLessThan) { productData.price = { $gt: priceGreaterThan } }

        if (name) {
            product = await productModel.find({ productData, title: new RegExp(name, 'i') }).sort({ price: 1 }) 
            if (product.length == 0) return res.status(404).send({ status: false, message: "Product Not Found." })
            return res.status(200).send({ status: true, message: "Successful", data: product })
        }

        let productsByFilter = await productModel.find(productData).sort({ price: 1 })
        if (productsByFilter.length == 0) return res.status(404).send({ status: false, message: "No Data Found" })
        res.status(200).send({ status: true, message: "Successful", data: productsByFilter })

    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}



const getProductsById = async function (req, res) {
    try {
        let productId = req.params.productId

        
        var isValid = mongoose.Types.ObjectId.isValid(productId)

        if (!isValid) return res.status(400).send({ status: false, message: "Enter Valid Product Id" })


        let productsDetails = await productModel.findById({ _id: productId, isDeleted: false })
        if (!productsDetails) {
            return res.status(404).send({ status: false, message: "Product Not Found" })
        } else {
            return res.status(200).send({ status: true, message: "Success", data: productsDetails })
        }
    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}


const delProductsById = async function (req, res) {
    try {
        let productId = req.params.productId
        var isValid = mongoose.Types.ObjectId.isValid(productId)
        if (!isValid) return res.status(400).send({ status: false, message: "Enter Valid Product Id" })
        let productsDetails = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() }, { new: true })
        if (!productsDetails) {
            return res.status(404).send({ status: false, message: "Product Not Found" })
        } else {
            return res.status(200).send({ status: true, message: "Successfully Deleted" })
        }
    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}

module.exports={createProduct,updateProduct,getProducts,getProductsById,delProductsById}
