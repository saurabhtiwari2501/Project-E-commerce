const userModel = require("../models/userModel")
const v = require("../validation/validation")
const bcrypt = require('bcrypt')

const aws = require("aws-sdk");

// aws.config.update({
//     accessKeyId: "AKIAY3L35MCRZNIRGT6N",
//     secretAccessKey: "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", //buket create
//     region: "ap-south-1"
// })

aws.config.update({
  accessKeyId: "AKIAY3L35MCRZNIRGT6N",
  secretAccessKey: "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",
  region: "ap-south-1"
})



let uploadFile= async ( file) =>{
   return new Promise( function(resolve, reject) {
    // this function will upload file to aws and return the link
    let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws

    var uploadParams= {
        ACL: "public-read", // public
        Bucket: "classroom-training-bucket",  //HERE  //user/object store
        Key: "abc/" + file.originalname, //HERE  // key+obj
        Body: file.buffer //
    }


    s3.upload( uploadParams, function (err, data ){ //callback
        if(err) {
            return reject({"error": err})
        }
        console.log(data)
        console.log("file uploaded succesfully")
        return resolve(data.Location)  
    })


   })
}




const createUser = async function (req,res){
    try{

      let files= req.files
      let uploadedFileURL
      if(files && files.length > 0){
          //upload to s3 and get the uploaded link
          // res.send the link back to frontend/postman
           uploadedFileURL= await uploadFile( files[0] )
           
      }
     // let profileImage
        let data = req.Body
        data.profileImage=uploadedFileURL
        if (!v.isvalidRequest(data)) return res.status(400).send({ status: false, message: 'user data is required in body' })
      
         const{fname,lname,email,phone,password,address:{shipping,billing}}=data
          // ------------------------ validation start -------------------------------
       // if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: 'No data provided' }) }
        
        
        if (fname) {
            return res.status(400).send({ status: false, msg: " fname must be required !" })
          }
      
          if (!v.isvalidName(fname)) { return res.status(400).send({ status: false, msg: "fname should start with Uppercase:- Fname" }) }
      
          if (!lname) { return res.status(400).send({ status: false, msg: " lname must be required !" }) }
      
          if (!/^[A-Z][a-z]{0,20}[A-Za-z]$/.test(lname)) { return res.status(400).send({ status: false, msg: "lname should start with Uppercase:- Lname" }) }
          if (!v.isValidSpace(phone)) return res.status(400).send({ status: false, message: 'phone is mandatory' })
          if (!v.isValidMobileNumber(phone)) return res.status(400).send({ status: false, message: 'Enter a valid 10 digit phone number' })

          //------------email validation------------------------//
      
          if (!email) {
            return res.status(400).send({ status: false, msg: "Email should be mandatory" })
          }
      
          if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, msg: "please provide valid email" })
          }
      
          let emailVerify = await userModel.findOne({ email: email })
      
          if (emailVerify) {
            return res.status(400).send({ status: false, msg: "this email already exists please provide another email" })
          }
          
      
          //------------password validation------------------------//
          if (!password) {
            return res.status(400).send({ status: false, msg: "password must be required !" })
          }
      
          if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@])[A-Za-z\d@]{8,}$/.test(password)) {
            return res.status(400).send({ status: false, msg: "password contain at least 8 chracter like: aQ1@asd5" })
          }
           const passwordbc=await bcrypt.hash(password, 10)
           if(!shipping){
            return res.status(400).send({stats:false, msg:"shiping details is mandatory"})
           }


           if(!billing){
            return res.status(400).send({stats:false, msg:"billing details is mandatory"})
           }
      
          let savedata = await userModel.create(data)
      
          res.status(201).send({ status: true, data: savedata });
        }
        catch (error) {
          console.log(error)
          res.status(500).send({ status: false, msg: error.message });
        }
      };



      const loginUser = async function (res, req) {
        try {
            let data = req.body;
            if (validate.isValidBody(data))
                return res.status(400).send({ status: false, msg: "Email and Password is Requierd" })
    
            const { email, password } = data;
    
            if (!email)
                return res.status(400).send({ status: false, msg: "User Email is Requierd" })
    
            if (!password)
                return res.status(400).send({ status: false, msg: "User Password is Requierd" })
    
            if (!validate.isValidEmail(email))
                return res.status(400).send({ status: false, msg: "Enter Valid Email Id" })
    
            let user = await userModel.findOne({ email })
            if (!user)
                return res.status(400).send({ status: false, msg: "User not Exist" })
    
            let actualPassword = await bcrypt.compare(password, user.password);
    
            if (!actualPassword)
                return res.status(400).send({ status: false, msg: "Incorrect password" })
    
    
            //Tocken Generation
    
            let tocken = jwt.sign({ userId: user._id }, "Product Managemnet", { expiresIn: '2d' })
    
            res.status(200).send({ status: true, message: "User login successfully", data: { userId: user._id, tocken: tocken} })
    
        } catch (err) {
            res.status(500).send({ status: false, Error: err.message })
        }
    };
    
    






module.exports.createUser=createUser
module.exports.loginUser=loginUser