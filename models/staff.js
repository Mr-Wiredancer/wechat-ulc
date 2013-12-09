var mongoose = require('./model.js')
	, Schema = mongoose.Schema;

var staffSchema = new Schema({
	openID: String
});

module.exports = mongoose.model('Staff', staffSchema);