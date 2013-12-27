var mongoose = require('./model.js')
	, Schema = mongoose.Schema;

var sessionSchema = new Schema({
  logs: [{type:Schema.Types.ObjectId, ref:'Log'}]
});

module.exports = mongoose.model('Session', sessionSchema);
