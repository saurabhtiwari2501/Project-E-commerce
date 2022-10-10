const express = require("express");
const router = express.Router();
const userController = require ("../controller/userController");



router.get("/test-me", function (req, res) {
    res.send("server is running ")
})



module.exports = router