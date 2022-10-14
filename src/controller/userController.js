const userModel = require("../models/userModel")
const validate = require("../validation/validation")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { uploadFile } = require("../AWS/aws")




const createUser = async (req, res) => {
  try {
    let data = req.body;
    let files = req.files;

     let { fname, lname, email, phone, address, password } = data;
  
   
    if (!validate.isValidRequest(data))
      return res.status(400).send({ status: false, message: "Enter User Details " }) 
           
    if (!validate.isValid(fname))
      return res.status(400).send({ status: false, message: "First Name Is Required " }) 

    if (!validate.isValidName(fname))
      return res.status(400).send({ status: false, message: "Enter Valid First Name " })
    
    if (!validate.isValid(lname))
      return res.status(400).send({ status: false, message: "Last Name Is Required " }) 
  
    if (!validate.isValidName(lname))
      return res.status(400).send({ status: false, message: "Enter Valid Last Name " })

    if (!validate.isValid(email))
      return res.status(400).send({ status: false, message: "Email Is Required " }) 
  
    if (!validate.isValidEmail(email))
      return res.status(400).send({ status: false, message: "Email Is Not Valid " })
   
    if (!validate.isValid(phone))
      return res.status(400).send({ status: false, message: " Phone Number is Required " })
  
    if (!validate.isValidMobile(phone))
      return res.status(400).send({ status: false, message: " Enter The Valid Number " })
  
    if (!validate.isValidPwd(password)) 
       return res.status(400).send({ status: false, message: "Password should be 8-15 characters long and must contain one of 0-9,A-Z,a-z and special characters" });


   if (address || address === "") {
    
    if(address === "")  return res.status(400).send({ status: false, message: "Enter Address" })
    
    let { shipping, billing } = address
    if (shipping) {
   
      if (!validator.isValid(shipping.street))
        return res.status(400).send({ status: false, message: "Street Is Required,should be in string value " })
      
      if (!validator.isValid(shipping.city))
        return res.status(400).send({ status: false, message: "city Is Required,should be in string value " })

      if (!validator.isValidName(shipping.city))
        return res.status(400).send({ status: false, message: "Enter Valid city" })
      
      if (!validator.isValidNumbers(shipping.pincode))
        return res.status(400).send({ status: false, message: "Pincode should be numerical" })

      if (!validator.isValidPincode(shipping.pincode))
        return res.status(400).send({ status: false, message: "Enter Valid Pincode " })
    }

    if (billing) { 
      
      if (!validator.isValid(billing.street))
        return res.status(400).send({ status: false, message: "Street Is Required,should be in string value " })
  
      if (!validator.isValid(billing.city))
        return res.status(400).send({ status: false, message: "City Is Required,should Be In String Value " })

      if (!validator.isValidName(billing.city))
        return res.status(400).send({ status: false, message: "Enter Valid city" })
       
      if (!validator.isValidNumber(billing.pincode))
        return res.status(400).send({ status: false, message: "Pincode should be Numerical" })

      if (!validator.isValidPincode(billing.pincode))
        return res.status(400).send({ status: false, message: "Enter Valid Pincode " })
    }

  }
   data.address = address
    
  
    let checkEmail = await userModel.findOne({ email: data.email });
    if (checkEmail) return res.status(400).send({ status: false, message: "Email already exist" });

    let checkPhone = await userModel.findOne({ phone: data.phone });
    if (checkPhone) return res.status(400).send({ status: false, message: "Phone number already exist" });

 
    let profileImgUrl = await uploadFile(files[0]);
    data.profileImage = profileImgUrl;

    data.password = await bcrypt.hash(data.password, 10);

    let responseData = await userModel.create(data);
   return res.status(201).send({ status: true, message: "User created successfully", data: responseData })
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message })
  }
};


const loginUser = async function (req, res) {
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



    let token = jwt.sign({ userId: user._id }, "Product Managemnet", { expiresIn: '2d' })

    return res.status(200).send({ status: true, message: "User login successfully", data: { userId: user._id, token: token } })

  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message })
  }
};

const getUserDetails = async function (req, res) {
  try {
    const userId = req.params.userId;
    const decodedToken = req.verifyed;

    if (!userId)
      return res
        .status(400)
        .send({ status: false, message: "Please provide userId." });

    if (!validate.isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "Please provide a valid userId." });

    if (userId !== decodedToken.userId)
      return res
        .status(401)
        .send({ status: false, message: "please login again." });

    const userData = await userModel.findById(userId);
    if (!userData)
      return res
        .status(404)
        .send({ status: false, message: "user not found." });

    return res
      .status(200)
      .send({ status: true, message: "User profile details", data: userData });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

const updateUser = async function (req, res) {
  try {
    let userId = req.params.userId
    let data = req.body
    const decodedToken = req.verifyed;


    if (!validate.isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Please provide a valid userId." });

    if (userId !== decodedToken.userId)
      return res.status(401).send({ status: false, message: "you are not authorised" });


    let { fname, lname, email, phone, password, address } = data;
    let profileImage = req.files



    if (!(profileImage || validate.isValidRequest(data)))
      return res.status(400).send({ status: false, message: "Enter User Details To Update " })



    if (profileImage.length) {

      if (!profileImage.length) return res.status(400).send({ status: false, message: " Please Provide The Profile Image" });
      if (!validate.isValidImage(profileImage[0].originalname)) return res.status(400).send({ status: false, message: "Give valid Image File" })

      let uploadedProfileImage = await uploadFile(profileImage[0])
      data.profileImage = uploadedProfileImage
    }

    if (fname || fname === "") {
     
      if (!validate.isValidName(fname))
        return res.status(400).send({ status: false, message: "Enter Valid First Name " })
    }

     if (lname || lname === "") {
           if (!validate.isValidName(lname))
        return res.status(400).send({ status: false, message: "Enter Valid Last Name " })
    }

    if (email || email === "") {
      if (!validate.isValid(email))
        return res.status(400).send({ status: false, message: "Email Is Required " })

      if (!validate.isValidEmail(email))
        return res.status(400).send({ status: false, message: "Email Is Not Valid " })

      const isDuplicate = await userModel.findOne({ email: email })
      if (isDuplicate) return res.status(400).send({ status: false, message: ` ${email} Already Exist` })
    }


    if (phone || phone === "") {
      if (!validate.isValid(phone))
        return res.status(400).send({ status: false, message: " Phone Number is Required " })

      if (!validate.isValidMobile(phone))
        return res.status(400).send({ status: false, message: " Enter The Valid Number " })

      const isDuplicate = await userModel.findOne({ phone: phone })
      if (isDuplicate) return res.status(400).send({ status: false, message: ` ${phone} Already Exist` })
    }

    if (password || password === "") {
      if (!validate.isValid(password))
        return res.status(400).send({ status: false, message: "Password Is Required " })

      if (!validate.isValidPwd(password))
        return res.status(400).send({ status: false, message: " Password Must be Include One special_char,Uppercase,Lowercase and Number ,Min 8 & Max 15 Char Are Allowed" })

      const encryptPassword = await bcrypt.hash(password, 10)
      data.password = encryptPassword;

    }

    if (address || address === "") {
      if (address === "") return res.status(400).send({ status: false, message: "Enter Address" })
          let { shipping, billing } = address
      if (shipping) {
        if (shipping.street) {
         
          if (!validate.isValid(shipping.street))
            return res.status(400).send({ status: false, message: "Enter Valid Street Of Shipping" })
        }

        if (shipping.city) {
         
          if (!validate.isValid(shipping.city))
            return res.status(400).send({ status: false, message: "Enter Valid City Of Shipping" })
        }

        if (shipping.pincode) {
          
          if (!validate.isValidPincode(shipping.pincode))
            return res.status(400).send({ status: false, message: "Enter Valid Pincode " })
        }
      }

      if (billing) {

        if (billing.street) {
          
          if (!validate.isValid(billing.street))
            return res.status(400).send({ status: false, message: "Enter Valid Street Of Billing" })
        }

        if (billing.city) {
          if (!validate.isValid(billing.city))
            return res.status(400).send({ status: false, message: "city Is Required,should be in string value " })

          if (!validate.isValid(billing.city))
            return res.status(400).send({ status: false, message: "Enter Valid city Of Billing" })
        }

        if (billing.pincode) {
          
          if (!validate.isValidPincode(billing.pincode))
            return res.status(400).send({ status: false, message: "Enter Valid Pincode " })
        }

      }
    }

    data.address = address
    let updateData = await userModel.findByIdAndUpdate({ _id: userId }, data, { new: true })
    res.status(200).send({ status: true, message: "User profile updated", data: updateData })
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}

module.exports = { createUser, loginUser, getUserDetails, updateUser };
