var TEXTTYPE = 'text'
	, VOICETYPE = 'voice'
	, VIDEOTYPE = 'video'
	, LOCATIONTYPE = 'location'
	, IMAGETYPE = 'image'
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
}

WeixinMessage.prototype.toJSON = function(){
	return JSON.stringify(this);
}

WeixinMessage.prototype.isSystemCommand = function(){
	var pattern = /^register31415926$/; //register as kefu
	return pattern.test(this.Content);
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
}

module.exports = WeixinMessage;