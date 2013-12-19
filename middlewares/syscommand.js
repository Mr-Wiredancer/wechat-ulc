var Staff = require('../models/staff.js');

module.exports = function(req, res, next){
	var msg = req.weixinMessage
	console.log(msg);
	if (!msg.isSystemCommand()) next(); return;//isn't system command

	if (msg.isRegisterCommand()){
		if (req.isFromStaff){
      		res.send(msg.makeResponseMessage('text', '[SYS]您已经是客服，请不要重复注册').toXML());
		}else{
			Staff.create({openId:req.weixinMessage.FromUserName}
				, function(err){
					if (err){
						//do something if it goes wrong
						console.log(err);
		         		res.send(msg.makeResponseMessage('text', '[SYS]注册失败，请再尝试一次').toXML());
					}else{
		         		res.send(msg.makeResponseMessage('text', '[SYS]您已成功注册成为客服').toXML());
					}
				});
		}
	}else {
		res.send(msg.makeResponseMessage('text', '[SYS]'+msg.toFormatJSON()).toXML()); 
	}
}