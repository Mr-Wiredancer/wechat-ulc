 var xml2js = require('xml2js')
 	, parseString = xml2js.parseString
	, WeixinMessage = require('../helpers/weixinmessage.js');



module.exports = function(req, res, next){
	var body = '';
	req.on('data', function(data){ body+=data; });

	req.on('end', function(){
		parseString(body, function(err, result){
			if (err) {
				/*do something*/
				console.log('weixinmessagebuilder: parsing error: %j', err);
        res.send('');
        return;
			}

			req.weixinMessage = new WeixinMessage(result.xml);
      req.weixinMessage.log();
      console.log('weixinMessage: %j', req.weixinMessage);
    	next();	
		});
	});
};
