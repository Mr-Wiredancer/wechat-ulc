var requestify = require('requestify')
	, Log = require('../models/log.js')
	, Staff = require('../models/staff.js')
    , Js2Xml = require('js2xml').Js2Xml;

//useful constants
var TEXTTYPE = 'text'
	, VOICETYPE = 'voice'
	, VIDEOTYPE = 'video'
	, LOCATIONTYPE = 'location'
	, LINKTYPE = 'link'
	, EVENTYPE = 'event'
	, IMAGETYPE = 'image';


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

WeixinMessage.prototype.isRecognizedVoiced = function(){
	return this.isVoice() && this.Recognition;
};

WeixinMessage.prototype.isImage = function(){
	return this.MsgType === IMAGETYPE;
};

WeixinMessage.prototype.Video = function(){
	return this.MsgType === VIDEOTYPE;
};

WeixinMessage.prototype.isEvent = function(){
	return this.MsgType === EVENTYPE;
};

WeixinMessage.prototype.isLink = function(){
	return this.MsgType === LINKTYPE;
};

WeixinMessage.prototype.isLocation = function(){
	return this.MsgType === LOCATIONTYPE;
};

//event type
WeixinMessage.prototype.isSubscribeEvent = function(){
	return this.isEvent() && this.Event === 'subscribe';
};

WeixinMessage.prototype.isPureSubscribeEvent = function(){
	return this.isSubscribeEvent && !this.EventKey;
};

WeixinMessage.prototype.isUnsubscribeEvent = WeixinMessage.prototype.isPureUnsubscribeEvent = function(){
	return this.isEvent() && this.Event === 'unsubscribe';
};

WeixinMessage.prototype.isScanBeforeSubscribeEvent = function(){
	return this.isSubscribeEvent() && this.EventKey && this.Ticket;
};

WeixinMessage.prototype.isScanAfterSubscribeEvent = function(){
	return this.isEvent() && this.Event === 'scan' && this.EventKey && this.Ticket;
};

WeixinMessage.prototype.isLocationEvent = function(){
	return this.isEvent() && this.Event === 'LOCATION';
};

WeixinMessage.prototype.isClickEvent = function(){
	return this.isEvent() && this.Event === 'CLICK';
};


WeixinMessage.prototype.toXML = function(){
	var result = new Js2Xml('xml', this);
	return result.toString();
};

//seems redundant
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
	return /^结束会话$/.test(this.Content);
};

WeixinMessage.prototype.isRegisterCommand = function(){
	return /^注册$/.test(this.Content);
};

WeixinMessage.prototype.sendThroughKefuInterface = function(token){
	requestify.post('https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+token, this);
	return;
};

WeixinMessage.prototype.log = function(){
	var l = new Log({content_json:this.toFormatJSON()});
	l.save();
};

WeixinMessage.prototype.saveStaff = function(){
	var s = new Staff({openId: this.FromUserName});
	s.save();
};

WeixinMessage.prototype.checkIfFromStaff = function(cbIfTrue, cbIfFalse){
	return Staff.findOne({openId: this.FromUserName}, 
		function(err, staff){
			if (staff){
				cbIfFalse();
			}else{
				cbIfTrue();
			}
	});
};


WeixinMessage.prototype.isKefuCommand = function(){
	return this.isKefuStartCommand() || this.isKefuEndCommand();
};

WeixinMessage.prototype.isKefuStartCommand = function(){
	return /^上班$/.test(this.Content);
}

WeixinMessage.prototype.isKefuEndCommand = function(){
	return /^下班$/.test(this.Content);
}

//automatic response to an incoming message. return a new WeixinMessage object. 
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