var mongoose = require ("mongoose")
	, uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/weixinkefu';

mongoose.connect(uristring, function(err, res){
	if (err) {
  		console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  	} else {
  		console.log ('Succeeded connected to: ' + uristring);
  	}
});

module.exports = mongoose;