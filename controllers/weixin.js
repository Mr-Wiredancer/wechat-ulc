var TOKEN = 'dxhackers'
  , currentSessions  = {}
  , msgQueue = []
  , kefuList = []
  , APPID = 'wx536ca9a0d796f541'
  , APPSECRET = '6b02a04187dcc4567f0f683a5e081773'
  , ACCESSTOKEN = ''
  , requestify = require('requestify')
	, WeixinMessage = require('../helpers/weixinmessage.js');


//NOT A GOOD IDEA: update the accesstoken every 7100s (weixin's expires every 7200s)
setInterval(function(){
  requestify.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+APPID+'&secret='+APPSECRET).then(function(response){
      var token = response.getBody().access_token;
      if (token){
        console.log('updated access token to '+token);
        ACCESSTOKEN = token;
      }
  });
}, 7100*1000);

exports.post = function(req, res){
	if (!isValidWeixinRequest(req.query.signature, req.query.timestamp, req.query.nonce)){
    res.send('You dont pass the validation'); //没有通过微信服务器的验证，可能是微信服务器出错或者恶意请求
    return;
  }

  var body = '';

  req.on('data', function(data){
  	body += data;
  });

  req.on('end', function(){
  	parseString(body, function(err, result){
  		var xml = result.xml
  			, msg = new WeixinMessage(xml);

      if (isInCurrentSession(msg)){
        //forward to corresopnding people  
      }else if ( isSystemCommand(msg) ){
        //currently system command is to register current user as kefu
        var user = msg.FromUserName;
        if (kefuList.indexOf(user)<0){
          var responseMsg = msg.makeResponseMessage('text', '您已注册成为客服，请不要重复注册');
          res.send(responseMsg.toXML());
        }else{
          kefuList.push(msg.FromUserName);
          
          var responseMsg = msg.makeResponseMessage('text', '您已成功注册成为客服');
          res.send(responseMsg.toXML());
        }
      }else if ( isKefuCommand(msg) ){

      }

  	});
  });

}

var sendKefuMsg = function(user, type, content){

}


//微信的服务器配置测试
exports.test = function(req, res){
	if ( isValidWeixinRequest(req.query.signature, req.query.timestamp, req.query.nonce)){
    res.send(req.query.echostr);
 	} 
}

//开发者验证流程： 将timestamp, nonce和TOKEN字典排序后生成的SHA1 Hash和signature匹配
var isValidWeixinRequest = function(signature, timestamp, nonce){
  var arr = ['dxhackers', timestamp, nonce];
  arr.sort();

  return crypto.createHash('sha1').update(arr.join('')).digest('hex') === signature;
}
