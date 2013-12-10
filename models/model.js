var mongoose = require ("mongoose")
	, uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/weixinkefu';

mongoose.connect(uristring, function(err, res){
	if (err) {
  		console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  	} else {
  		console.log ('Succeeded connected to: ' + uristring);
  		mongoose.connection.collections['logs'].drop(function(err){
  			if (!err) console.log('dropped logs collection');
  			if (err) console.log(err);
  		});
  	}
});

module.exports = mongoose;