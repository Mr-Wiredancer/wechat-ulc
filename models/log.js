var mongoose = require('./model.js')
	, Schema = mongoose.Schema;

var logSchema = new Schema({
	content_json: String
}, {capped: true});

module.exports = mongoose.model('Log', logSchema);