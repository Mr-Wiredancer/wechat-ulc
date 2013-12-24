var Staff = require('../models/staff.js');

module.exports = function(req, res, next){
	var msg = req.weixinMessage
	if (!msg.isSystemCommand()){ next(); return;}//isn't system command

	if (msg.isRegisterCommand()){
		if (req.isFromStaff){
      		res.send(msg.makeResponseMessage('text', '[SYS]您已经是客服，请不要重复注册').toXML());
		}else{
			Staff.create({openId:req.weixinMessage.FromUserName}
				, function(err){
					if (err){
						//do something if it goes wrong
						console.log('Registration failed. The error is %j', err);

		         		res.send(msg.makeResponseMessage('text', '[SYS]注册失败，请再尝试一次').toXML());
					}else{
						console.log('Registration succeeded');
		         		res.send(msg.makeResponseMessage('text', '[SYS]您已成功注册成为客服').toXML());
					}
				});
		}
	}else if(msg.isCounterRegisterCommand()){
		if (req.isFromStaff){
			Staff.remove({openId:req.weixinMessage.FromUserName}
				, function(err){
					if (err){
						console.log('Counter registration failed. The error is %j', err);
						res.send(msg.makeResponseMessage('text', '[SYS]反注册失败').toXML());
					}else{
						console.log('Counter Registration succeeded');

						res.send(msg.makeResponseMessage('text', '[SYS]你的客服身份已删除').toXML());
					}

				});
		} else {
			res.send(msg.makeResponseMessage('text', '[SYS]您不是客服').toXML());
		}
		
	}else {
		res.send(msg.makeResponseMessage('text', '[SYS]' + msg.toFormatJSON()).toXML()); 
	}
}