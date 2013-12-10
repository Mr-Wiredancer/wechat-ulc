var mongoose = require('./model.js')
	, Schema = mongoose.Schema;

var logSchema = new Schema({
	content_json: String,
	"_id": {type:Schema.ObjectId, index:{unique:true}}
}, {capped: {size:8000000, max:100, autoIndexId:false}});

module.exports = mongoose.model('Log', logSchema);