const express=require('express')
const bodyParser = require('body-parser')
const multer=require('multer')
const route = require('./routes/routes')
const mongoose  = require('mongoose')
const app = express()

app.use(bodyParser.json())
app.use(multer().any())


mongoose.connect("mongodb+srv://Saurabh_Tiwari:Project_All@project-all.btz010p.mongodb.net/E_Commerce", {
        useNewUrlParser: true
    })
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))


app.use('/', route)


app.listen(process.env.PORT || 3000, function() {
    console.log('Project is running on port ' + (process.env.PORT || 3000))
})