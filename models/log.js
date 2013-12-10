var mongoose = require('./model.js')
	, Schema = mongoose.Schema;

var logSchema = new Schema({
	content_json: String
}, {capped: true, size:8000000});

module.exports = mongoose.model('Log', logSchema);