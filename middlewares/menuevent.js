module.exports = function(req, res, next){
	var msg = req.weixinMessage;
	if (!msg.isClickEvent()) next();

	if (req.isFromStaff){
		res.send(msg.makeResponseMessage('text', '[SYS]菜单不对客服开放使用').toXML());
	}else{
		
	}
};