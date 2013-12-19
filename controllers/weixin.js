var TOKEN = 'dxhackers'
  , crypto = require('crypto')
  , xml2js = require('xml2js')
  , parseString = xml2js.parseString
  , currentSessions  = {}
  , msgQueue = []
  , kefuList = []
  // , APPID = 'wx536ca9a0d796f541'
  , APPID = 'wx07031480fe88fbf6' //TEST ACCOUNT
  // , APPSECRET = '6b02a04187dcc4567f0f683a5e081773'
  , APPSECRET = 'f73012337cad2ab2a8008cb27b54775c'
  // , ACCESSTOKEN = ''
  // , requestify = require('requestify')
	, WeixinMessage = require('../helpers/weixinmessage.js');


//NOT A GOOD IDEA: update the accesstoken every 7100s (weixin's expires every 7200s)
// var updateAccessToken = function(){
//   requestify.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+APPID+'&secret='+APPSECRET).then(function(response){
//       var token = response.getBody()['access_token'];
//       console.log(response.getBody());
//       if (token){
//         ACCESSTOKEN = token;
//       }
//   });
// };

// updateAccessToken();
// setInterval(updateAccessToken, 7100*1000);

exports.post = function(req, res){
	// if (!isValidWeixinRequest(req.query.signature, req.query.timestamp, req.query.nonce)){
 //    res.send('You dont pass the validation'); //没有通过微信服务器的验证，可能是微信服务器出错或者恶意请求
 //    return;
 //  }

  var body = '';

  req.on('data', function(data){
  	body += data;
  });

  req.on('end', function(){
  	parseString(body, function(err, result){
  		var xml = result.xml
  			, msg = new WeixinMessage(xml);

      msg.log();
      if ( msg.isSystemCommand() ){
        //currently system command is to register current user as kefu
        console.log('system command');
        var user = msg.FromUserName;

        if (msg.isRegisterCommand()){
          // if (kefuList.indexOf(user)>-1){
          msg.checkIfFromStaff(function(){
            var responseMsg = msg.makeResponseMessage('text', '[SYS]您已注册成为客服，请不要重复注册');
            res.send(responseMsg.toXML());
          }, function(){
            msg.addFromUserAsStaff(function(){
              var responseMsg = msg.makeResponseMessage('text', '[SYS]您已成功注册成为客服');
              res.send(responseMsg.toXML());
            });
          });  

          // if (msg.isFromStaff()){   
          //   var responseMsg = msg.makeResponseMessage('text', '[SYS]您已注册成为客服，请不要重复注册');
          //   res.send(responseMsg.toXML());
          // }else{
          //   kefuList.push(msg.FromUserName);
            
          //   msg.saveStaff();
          //   var responseMsg = msg.makeResponseMessage('text', '[SYS]您已成功注册成为客服');
          //   res.send(responseMsg.toXML());
          // }
        }else if( msg.isEndSessionCommand() ){
          console.log('收到结束对话请求');
          if ( user in currentSessions ){
            var session = currentSessions[user]
              , client = session.client
              , kefu = session.kefu; 

            delete currentSessions[client];
            delete currentSessions[kefu];

            //tell both to end session
            var msgData = {
                  'touser': [kefu],
                  'msgtype': ['text'],
                  'text': [{'content':"[SYS]会话结束"}]
                };                  

            var msg1 = new WeixinMessage(msgData);
            console.log('msg1');
            console.log(msg1);
            msgData.touser = [client];
            var msg2 = new WeixinMessage(msgData);
            console.log('msg2');
            console.log(msg2);
            msg1.sendThroughKefuInterface(ACCESSTOKEN);
            msg2.sendThroughKefuInterface(ACCESSTOKEN);

            // console.log('should not reach here');
            if ( msgQueue.length>0){
              var waitMsg = msgQueue[0];

              if ( waitMsg.MsgType != 'kefu' ){
                console.log('thre\'s a match and needa forward the msg');

                msgQueue = msgQueue.slice(1);
                var newClient = waitMsg.FromUserName;
                currentSessions[newClient] = currentSessions[kefu] = {'client':newClient, 'kefu':kefu};

                //TODO: send client message to kefu
                var notifData = {
                  'touser': [kefu],
                  'msgtype': ['text'],
                  'text': [{'content':"[SYS]开始与下一位客户对话"}]
                };
                var notif = new WeixinMessage(notifData);
                notif.sendThroughKefuInterface(ACCESSTOKEN);

                forwardMsgTo(waitMsg, kefu);
                return
              }
            }

            msgQueue.push(new WeixinMessage({'FromUserName':[kefu], 'MsgType': ['kefu']}));

          }else{
            res.send(msg.makeResponseMessage('text', '[SYS]您没有在任何会话里').toXML());
          }
        }else if(msg.isResetCommand()){
          msgQueue = [];
          kefuList = [];
          currentSessions = {};
          res.send(msg.makeResponseMessage('text', '[SYS]全部清除').toXML());
        }

        return;
      }else if ( kefuList.indexOf(msg.FromUserName)>-1 && msg.isKefuCommand()){
        console.log('是客服而且是客服命令');

        var kefu = msg.FromUserName;

        if (msg.isKefuStartCommand()){

          if ( !(kefu in currentSessions) && msgQueue.length!=0 && !isInMsgQueue(kefu) ){

            console.log(msgQueue);
            var waitMsg = msgQueue[0];
            if ( waitMsg.MsgType != 'kefu' ){
              console.log('thre\'s a match and needa forward the msg');

              msgQueue = msgQueue.slice(1);
              var client = waitMsg.FromUserName;
              currentSessions[client] = currentSessions[kefu] = {'client':client, 'kefu':kefu};

              var notifData = {
                'touser': [kefu],
                'msgtype': ['text'],
                'text': [{'content':"[SYS]开始与下一位客户对话"}]
              };
              var notif = new WeixinMessage(notifData);
              notif.sendThroughKefuInterface(ACCESSTOKEN);
              //TODO: send client message to kefu
              forwardMsgTo(waitMsg, kefu);
            }
          
            var m = new WeixinMessage({'FromUserName':[msg.FromUserName], 'MsgType': ['kefu']});
            msgQueue.push(m);
            res.send(msg.makeResponseMessage('text', '[SYS]暂时没有在等待的客户，请耐心等候').toXML());
            return;

          }else{
            if (msgQueue.length === 0){
              var m = new WeixinMessage({'FromUserName':[msg.FromUserName], 'MsgType': ['kefu']});
              msgQueue.push(m);
              res.send(msg.makeResponseMessage('text', '[SYS]暂时没有在等待的客户，请耐心等候').toXML());
            }else{
              res.send(msg.makeResponseMessage('text', '[SYS]你已经在工作中，不需要重复打卡').toXML());
            }
            return;
          }

        }else if ( kefuList.indexOf(msg.FromUserName)>-1 && msg.isKefuEndCommand() ){
          var kefu = msg.FromUserName;
          if (isInMsgQueue(kefu)){
            deleteMsgFromQueue(kefu);
            res.send(msg.makeResponseMessage('text', '[SYS]已下班').toXML());
          }else if (kefu in currentSessions) {
            res.send(msg.makeResponseMessage('text', '[SYS]请结束与当前用户的对话后再下班').toXML());
          }else{
            res.send(msg.makeResponseMessage('text', '[SYS]你还没打卡上班').toXML());
          }
          return;
        }

      }else if (isInCurrentSession(msg)){

        //forward to corresopnding people 
        console.log('in current session'); 
        var fromUserName = msg.FromUserName;

        var session = currentSessions[fromUserName];

        var toUserName;
        if (fromUserName === session.client){
          toUserName = session.kefu;
        }else{
          toUserName = session.client;
        }

        forwardMsgTo(msg, toUserName);
        return;
      }else if( kefuList.indexOf(msg.FromUserName)<0 ){

        console.log('客户信息');
        console.log(msgQueue);

        if (msgQueue.length === 0 || msgQueue[0].MsgType!='kefu' ){
          console.log('没有客服');
          msgQueue.push(msg);
          res.send(msg.makeResponseMessage('text', '[SYS]暂时没有在线的客服，请耐心等候').toXML());

        } else {
          console.log('有客服，转发');  
          var kefuMsg = msgQueue.shift();
          var client = msg.FromUserName;
          var kefu = kefuMsg.FromUserName;
          currentSessions[client] = currentSessions[kefu] = {'client':client, 'kefu':kefu};

          var notifData = {
            'touser': [kefu],
            'msgtype': ['text'],
            'text': [{'content':"[SYS]开始与下一位客户对话"}]
          };
          var notif = new WeixinMessage(notifData);
          notif.sendThroughKefuInterface(ACCESSTOKEN);

          forwardMsgTo(msg, kefu);
          return;
        } 
      }else{
      }

  	});
  });

}

var forwardMsgTo = function (fromMsg, toUserName){
  console.log('forward msg starts');
  var msgData
    , msgType = fromMsg.MsgType;

  if (msgType === 'text'){
    msgData = {
      'touser': [toUserName],
      'msgtype': ['text'],
      'text': [{'content':fromMsg.Content}]
    };
  }else if (msgType === 'image'){

    msgData = {
      'touser': [toUserName],
      'msgtype': ['image'],
      'image': [{'media_id': fromMsg.MediaId}]
    };
  }else if (msgType === 'voice'){
    msgData = {
      'touser': [toUserName],
      'msgtype': ['voice'],
      'voice': [{'media_id': fromMsg.MediaId}]
    }
  }
  var m = new WeixinMessage(msgData);
  m.sendThroughKefuInterface(ACCESSTOKEN);
  console.log('before return');
  return;
}

var deleteMsgFromQueue = function(kefuID){
  var i;
  for ( i = 0; i < msgQueue.length; i++ ){
    if ( msgQueue[i].FromUserName === kefuID ){
        break;
    }
  }
  msgQueue.splice(i, 1);
  return;
}

var isInMsgQueue = function(kefuID){
  for (var i = 0; i < msgQueue.length; i++){
    if ( msgQueue[i].FromUserName === kefuID ){
        return true;
    }
  }
  return false;
}

var isInCurrentSession = function(msg){
  return msg.FromUserName in currentSessions;
}

//微信的服务器配置测试
exports.test = function(req, res, next){
  console.log(next);
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
