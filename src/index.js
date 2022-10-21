const express=require('express')
const bodyParser = require('body-parser')
const multer=require('multer')
const route = require('./routes/routes')
const mongoose  = require('mongoose')
const app = express()

app.use(bodyParser.json())
app.use(multer().any())


mongoose.connect("mongodb+srv://functionup-cohert:2aZSPLpUOON7ZWA2@cluster0.sl0yd7n.mongodb.net/PRODUCTMANAGEMENT", {
        useNewUrlParser: true
    })
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))


app.use('/', route)


app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
})