const jwt = require('jsonwebtoken')

const authentication= async (req, res, next) =>{
    try {
        let token =  req.rawHeaders[1].split(" ")[1];
        
    if (!token) {
      return res.status(400).send({ status: false, message: "provide token in the headers" });
    }  

    jwt.verify(token, "Product Managemnet", function (err, decodedToken) {
        if (err) {
          return res.status(401).send({ status: false, message: err.message });
        } else {
          req.verifyed= decodedToken;
          next() 

        } 
      }); 

        
    } catch (error) {
        res.status(500).send({ status: false, message: err.message });
    }
}

const authorise = async function (req, res, next) {
  try {
      let token = req.headers.authorization.slice(7)

      let decodedToken = jwt.verify(token, "Product Managemnet")
      if (!decodedToken) return res.status(401).send({ status: false, message: "token is not valid" })
        data = req.params.userId
      var isValid = mongoose.Types.ObjectId.isValid(data)
  
      if (!isValid) return res.status(400).send({ status: false, message: "Enter Valid User Id" })
      let userData = await userModel.findById(dataToBeModified)
      if (!userData) { return res.status(404).send({ status: false, message: "user not found" }) }
      
      if (userData._id == decodedToken.userId) {
          next()
      } else { return res.status(403).send({ status: false, message: 'NOT AUTHORISED USER' }) }
  }
  catch (error) {
      res.status(500).send({ message: error.message })
  }
}


module.exports ={authentication,authorise}