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

    if (!validate.isValidPhone(data.phone)) return res.status(400).send({ status: false, message: "Enter a valid phone number" });

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

module.exports = {createUser,loginUser, getUserDetails };
