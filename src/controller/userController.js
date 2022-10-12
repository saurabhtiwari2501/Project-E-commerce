const userModel = require("../models/userModel")
const validate = require("../validation/validation")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const aws = require("aws-sdk");

aws.config.update({
  accessKeyId: "AKIAY3L35MCRZNIRGT6N",
  secretAccessKey: "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",
  region: "ap-south-1"
});

const uploadFile = async (files) => {
  return new Promise(function (resolve, reject) {
    let s3 = new aws.S3({ apiVersion: '2006-03-01' });

    let uploadParams = {
      ACL: 'public-read',
      Bucket: 'classroom-training-bucket',
      Key: "abc/" + files.originalname,
      Body: files.buffer
    };

    s3.upload(uploadParams, function (err, data) {
      if (err) {
        return reject({ 'error': err });
      }
      return resolve(data.Location);
    })
  })
};


const createUser = async (req, res) => {
  try {
    let data = req.body;
    let files = req.files;

    if (validate.isValidBody(data)) return res.status(400).send({ status: false, message: "Enter details to create your account" });
    if (validate.isValid(data.fname)) return res.status(400).send({ status: false, message: "First name is required" });
    if (validate.isValid(data.lname)) return res.status(400).send({ status: false, message: "Last name is required " });
    if (!data.email) return res.status(400).send({ status: false, message: "User email-id is required" });
    if (files.length == 0) return res.status(400).send({ status: false, message: "Please upload profile image" });
    if (!data.phone) return res.status(400).send({ status: false, message: "User phone number is required" });
    if (!data.password) return res.status(400).send({ status: false, message: "Password is required" });
    if (!data.address) return res.status(400).send({ status: false, message: "Address is required" });
    if (validate.isValid(data.address)) return res.status(400).send({ status: false, message: "Address must contain shipping and billing addresses" });
    if (validate.isValid(data.address.shipping)) return res.status(400).send({ status: false, message: "Shipping address must contain street, city and pincode" });
    if (validate.isValid(data.address.shipping.street)) return res.status(400).send({ status: false, message: "Street is required of shipping address" });
    if (validate.isValid(data.address.shipping.city)) return res.status(400).send({ status: false, message: "City is required of shipping address" });
    if (validate.isValid(data.address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode is required of shipping address " });

    if (!validate.isValidString(data.address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" });

    if (!validate.isValidPincode(data.address.shipping.pincode)) return res.status(400).send({ status: false, message: "Enter a valid pincode" });

    if (validate.isValid(data.address.billing)) return res.status(400).send({ status: false, message: "Billing address must contain street, city and pincode" });

    if (validate.isValid(data.address.billing.street)) return res.status(400).send({ status: false, message: "Street is required of billing address" });

    if (validate.isValid(data.address.billing.city)) return res.status(400).send({ status: false, message: "City is required of billing address" });

    if (validate.isValid(data.address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode is required of billing address" });

    if (!validate.isValidString(data.address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode should be in numbers" });

    if (!validate.isValidPincode(data.address.billing.pincode)) return res.status(400).send({ status: false, message: "Enter a valid pincode" });

    if (validate.isValidString(data.fname)) return res.status(400).send({ status: false, message: "Enter a valid first name and should not contain numbers" });

    if (validate.isValidString(data.lname)) return res.status(400).send({ status: false, message: "Enter a valid last name and should not contain numbers" });

    if (!validate.isValidEmail(data.email)) return res.status(400).send({ status: false, message: "Enter a valid email-id" });

    if (!validate.isValidMobile(data.phone)) return res.status(400).send({ status: false, message: "Enter a valid phone number" });

    if (!validate.isValidPwd(data.password)) return res.status(400).send({ status: false, message: "Password should be 8-15 characters long and must contain one of 0-9,A-Z,a-z and special characters" });

    //checking if email already exist or not
    let checkEmail = await userModel.findOne({ email: data.email });
    if (checkEmail) return res.status(400).send({ status: false, message: "Email already exist" });

    //checking if phone number already exist or not
    let checkPhone = await userModel.findOne({ phone: data.phone });
    if (checkPhone) return res.status(400).send({ status: false, message: "Phone number already exist" });

    //getting the AWS-S3 link after uploading the user's profileImage
    let profileImgUrl = await uploadFile(files[0]);
    data.profileImage = profileImgUrl;

    //hashing the password with bcrypt
    data.password = await bcrypt.hash(data.password, 10);

    let responseData = await userModel.create(data);
    res.status(201).send({ status: true, message: "User created successfully", data: responseData })
  } catch (err) {
    res.status(500).send({ status: false, error: err.message })
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


    //Tocken Generation

    let tocken = jwt.sign({ userId: user._id }, "Product Managemnet", { expiresIn: '2d' })

    return res.status(200).send({ status: true, message: "User login successfully", data: { userId: user._id, tocken: tocken } })

  }catch (err) {
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
  try{
  let userId = req.params.userId
  let data = req.body
  const decodedToken = req.verifyed;


  if (!validate.isValidObjectId(userId))
       return res
         .status(400) 
         .send({ status: false, message: "Please provide a valid userId." });
 
     if (userId !== decodedToken.userId)
       return res
         .status(401)
         .send({ status: false, message: "you are not authorised" });


  let { fname, lname, email, phone, password,address } = data;
 let profileImage = req.files


 
  if(!(profileImage || validate.isValidRequest(data)))
  return res.status(400).send({status:false, message:"Enter User Details To Update "}) 


  
  if (profileImage.length) {
  
    if (!profileImage.length)  return res.status(400).send({ status: false, message: " Please Provide The Profile Image" });
    if(!validate.isValidImage(profileImage[0].originalname)) return res.status(400).send({status:false, message:"Give valid Image File"})

    let uploadedProfileImage = await uploadFile(profileImage[0])
    data.profileImage = uploadedProfileImage
  }

  if (fname || fname === "") {
    if (validate.isValidString(fname))
      return res.status(400).send({ status: false, message: "First Name Is Required " }) 

    if (!validate.isValidName(fname))
      return res.status(400).send({ status: false, message: "Enter Valid First Name " })
  }

  if (lname || lname === "") {
    if (!validate.isValidString(lname))
      return res.status(400).send({ status: false, message: "Last Name Is Required " })

    if (!validate.isValidName(lname))
      return res.status(400).send({ status: false, message: "Enter Valid Last Name " })
  }

  if (email || email === "") {
    if (!validate.isValidString(email))
      return res.status(400).send({ status: false, message: "Email Is Required " }) 

    if (!validate.isValidEmail(email))
      return res.status(400).send({ status: false, message: "Email Is Not Valid " })

    const isDuplicate = await userModel.findOne({ email: email })
    if (isDuplicate) return res.status(400).send({ status: false, message: ` ${email} Already Exist` })
  }


  if (phone || phone === "") {
    if (!validate.isValidString(phone))
      return res.status(400).send({ status: false, message: " Phone Number is Required " })

    if (!validate.isValidMobile(phone))
      return res.status(400).send({ status: false, message: " Enter The Valid Number " })

    const isDuplicate = await userModel.findOne({ phone: phone })
    if (isDuplicate) return res.status(400).send({ status: false, message: ` ${phone} Already Exist` })
  }

  if (password || password === "") {
    if (!validate.isValidString(password))
      return res.status(400).send({ status: false, message: "Password Is Required " })

    if (!validate.isValidPwd(password))
      return res.status(400).send({ status: false, message: " Password Must be Include One special_char,Uppercase,Lowercase and Number ,Min 8 & Max 15 Char Are Allowed" })

    const encryptPassword = await bcrypt.hash(password, 10)
    data.password = encryptPassword;

  }

  if (address || address === "") {
    if(address === "")  return res.status(400).send({ status: false, message: "Enter Address" })
    var parsedAddress = JSON.parse(address) 
    let { shipping, billing } = parsedAddress
    if (shipping) {
   if (shipping.street) {
        if (!validate.isValidString(shipping.street))
          return res.status(400).send({ status: false, message: "Street Is Required,Should Be In String Value " })

        if (!validate.isValidStreet(shipping.street))
          return res.status(400).send({ status: false, message: "Enter Valid Street Of Shipping" })
      }

      if (shipping.city) {
        if (!validate.isValidString(shipping.city))
          return res.status(400).send({ status: false, message: "City Is Required,Should Be In String Value " })

        if (!validate.isValidName(shipping.city))
          return res.status(400).send({ status: false, message: "Enter Valid City Of Shipping" })
      }

      if (shipping.pincode) {
        if (!validate.isValidNumber(shipping.pincode))
          return res.status(400).send({ status: false, message: "Pincode Should Be Numerical" })

        if (!validate.isValidPincode(shipping.pincode))
          return res.status(400).send({ status: false, message: "Enter Valid Pincode " })
      }
    }

    if (billing) {

      if (billing.street) {
        if (!validate.isValidString(billing.street))
          return res.status(400).send({ status: false, message: "Street Is Required,should be in string value " })

        if (!validate.isValidStreet(billing.street))
          return res.status(400).send({ status: false, message: "Enter Valid Street Of Billing" })
      }

      if (billing.city) {
        if (!validate.isValidString(billing.city))
          return res.status(400).send({ status: false, message: "city Is Required,should be in string value " })

        if (!validate.isValidName(billing.city))
          return res.status(400).send({ status: false, message: "Enter Valid city Of Billing" })
      }

      if (billing.pincode) {
        if (!validate.isValidNumber(billing.pincode))
          return res.status(400).send({ status: false, message: "Pincode Should Be Numerical" })

        if (!validate.isValidPincode(billing.pincode))
          return res.status(400).send({ status: false, message: "Enter Valid Pincode " })
      }

    }
  }

  data.address = parsedAddress
  let updateData = await userModel.findByIdAndUpdate({ _id: userId }, data, { new: true })
  res.status(200).send({ status: true, message: "User profile updated", data: updateData })
  }
  catch (err)
   {
    return res.status(500).send({status:false , message:err.message})
  }
  }

module.exports = {createUser,loginUser, getUserDetails, updateUser };
