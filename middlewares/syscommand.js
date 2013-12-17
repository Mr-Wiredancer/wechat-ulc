module.exports = function(req, res, next){
	var msg = req.weixinMessage
	if (!msg.isSystemCommand()) next(); //isn't system command

	if (msg.isRegisterCommand()){
		if (req.isFromStaff){
          	res.send(msg.makeResponseMessage('text', '[SYS]您已成功注册成为客服').toXML());
		}else{
      		res.send(msg.makeResponseMessage('text', '[SYS]请不要重复注册').toXML());
		}
	}else {
		res.send(msg.makeResponseMessage('text', '[SYS]'+msg.toJSON()).toXML()); 
	}
}