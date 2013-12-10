var mongoose = require('./model.js')
	, Schema = mongoose.Schema;

var staffSchema = new Schema({
	openId: String
});

module.exports = mongoose.model('Staff', staffSchema);