var Session = require('../models/session.js');

module.exports = function(req, res, next){
	Session.findOne(req.isFromStaff?{staffOpenId:req.weixinMessage.fromUserName}:{clientOpenId:req.weixinMessage.fromUserName}
		, function(err, session){
			if (session){
				req.weixinSession = session;
				next();
			}
		});


};