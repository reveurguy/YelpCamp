const mongoose = require('mongoose');
var passportLocalMongoose  = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	username: String,
	password: String,
	email: String,
	avatar: String,
 	phone: String,
	firstName: String,
	lastName: String
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);