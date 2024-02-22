const mongoose = require('mongoose')



let cartSchema = new mongoose.Schema({
    
    userId: {type:mongoose.Schema.Types.ObjectId, ref:"user", required:true , unique: true},
    items: [{
      productId: {type:mongoose.Schema.Types.ObjectId, ref:"products", required:true},
      quantity: {type:Number, required:true, minlen: 1}
    }],
    totalPrice: {type:Number, required:true},
    totalItems: {type:Number, required:true},
  },
  {timestamps:true})

  module.exports=mongoose.model("cart",cartSchema)