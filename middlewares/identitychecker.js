var Staff = require('../models/staff.js');

module.exports = function(req, res, next){
	Staff.findOne({openId:req.weixinMessage.FromUserName}
		, function(err, staff){
			// console.log(staff);
			req.isFromStaff = !!staff;
			next();
		});
}