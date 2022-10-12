const express = require("express");
const router = express.Router();
const  {createUser,loginUser, getUserDetails, updateUser }= require ("../controller/userController");
const { authentication } = require("../middleware/auth");



//router.get("/test-me", function (req, res) {
  //  res.send("server is running ")
//})


router.post("/register",createUser)
router.post("/loginUser", loginUser)
router.get("/user/:userId/profile", authentication, getUserDetails);
router.put("/user/:userId/profile", authentication, updateUser)



module.exports = router