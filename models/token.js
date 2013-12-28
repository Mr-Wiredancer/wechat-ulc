var mongoose = require('./model.js')
	, Schema = mongoose.Schema;

var tokenSchema = new Schema({
	token: String
});

module.exports = mongoose.model('Token', tokenSchema);