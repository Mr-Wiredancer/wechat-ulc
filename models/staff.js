var mongoose = require('./model.js')
	, Schema = mongoose.Schema;

var staffSchema = new Schema({
	openId: String
});

staffSchema.path('openId').validate(function(val){
	return !(/^\s*$/.test(val));
}, 'openId cannot be empty');

module.exports = mongoose.model('Staff', staffSchema);