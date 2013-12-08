var TEXTTYPE = 'text'
	, VOICETYPE = 'voice'
	, VIDEOTYPE = 'video'
	, LOCATIONTYPE = 'location'
	, IMAGETYPE = 'image'
	, requestify = require('requestify')
    , Js2Xml = require('js2xml').Js2Xml;


var WeixinMessage = function(data){
	for (var key in data){
		this[key] = data[key][0];
	}
};

WeixinMessage.prototype.isText = function(){
	return this.MsgType === TEXTTYPE;
};

WeixinMessage.prototype.isVoice = function(){
	return this.MsgType === VOICETYPE;
};

WeixinMessage.prototype.isImage = function(){
	return this.MsgType === IMAGETYPE;
};

WeixinMessage.prototype.toXML = function(){
	var result = new Js2Xml('xml', this);
	return result.toString();
};

WeixinMessage.prototype.toFormatJSON = function(){
	return JSON.stringify(this);
};

WeixinMessage.prototype.isResetCommand = function(){
	return /^reset$/.test(this.Content);
}

WeixinMessage.prototype.isSystemCommand = function(){
	return this.isRegisterCommand() || this.isEndSessionCommand() || this.isResetCommand();
};

WeixinMessage.prototype.isEndSessionCommand = function(){
	return /^endsession$/.test(this.Content);
};

WeixinMessage.prototype.isRegisterCommand = function(){
	return /^注册$/.test(this.Content);
};

WeixinMessage.prototype.sendThroughKefuInterface = function(token){
	requestify.post('https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+token, this);
	return;
}

WeixinMessage.prototype.isKefuCommand = function(){
	return this.isKefuStartCommand() || this.isKefuEndCommand();
};

WeixinMessage.prototype.isKefuStartCommand = function(){
	return /^beginwork$/.test(this.Content);
}

WeixinMessage.prototype.isKefuEndCommand = function(){
	return /^endwork$/.test(this.Content);
}

WeixinMessage.prototype.makeResponseMessage = function(type, content){
	var msg = new WeixinMessage();
	msg.FromUserName = this.ToUserName;
	msg.ToUserName = this.FromUserName;

	msg.MsgType = type;
	msg.CreateTime = (new Date).getTime().toString();
	if (type === TEXTTYPE){
		msg.Content = content;
	}else if (type === IMAGETYPE || type === VOICETYPE){
		msg.MediaId = content;
	}

	return msg;
};

module.exports = WeixinMessage;