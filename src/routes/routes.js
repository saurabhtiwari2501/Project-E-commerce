const express = require("express");
const router = express.Router();
const userController = require ("../controller/userController");



//router.get("/test-me", function (req, res) {
  //  res.send("server is running ")
//})


router.post("/register",userController.createUser)
router.post("/loginUser", userController.loginUser)


module.exports = router