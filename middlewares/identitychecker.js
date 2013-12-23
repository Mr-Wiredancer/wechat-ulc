var Staff = require('../models/staff.js');

module.exports = function(req, res, next){
	Staff.findOne({openId:req.weixinMessage.FromUserName}
		, function(err, staff){
			if (err){
				console.log('error finding staff in identitychecker');
				console.log(err);
			}

			req.isFromStaff = !!staff;
			next();
		});
}
