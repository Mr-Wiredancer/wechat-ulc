var mongoose = require(./model.js);




var logSchema = mongoose.Schema({
	content: String, 
	msgType: String, 
	time: String,

});