var Staff = require('../models/staff.js');

module.exports = function(req, res, next){
	Staff.findOne({openId:req.weixinMessage.FromUserName}
		, function(err, staff){
			if (err){
				console.log('identitychecker: error finding: %j', err);
        res.send('');
        return;
			}

			req.isFromStaff = !!staff;
			next();
		});
}
