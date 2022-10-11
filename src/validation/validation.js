const mongoose = require('mongoose')



const isValidSpace = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}
const isvalidRequest = function (body) {
    return Object.keys(body).length > 0 //plz enter the data in the body
}

const isvalidName = function(fname){
    return /^[A-Z][a-z]{0,20}[A-Za-z]$/.test(fname)
}

const isValidMobileNumber = function (number) {
    return /^[6-9]\d{9}$/.test(number) //9587412693
}



module.exports = {isValidSpace,isvalidRequest,isvalidName,isValidMobileNumber}