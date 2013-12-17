var mongoose = require('./model.js')
	, Schema = mongoose.Schema;

var sessionSchema = new Schema({
	clientOpenId: String,
	staffOpenId: String
});

module.exports = mongoose.model('Session', sessionSchema);