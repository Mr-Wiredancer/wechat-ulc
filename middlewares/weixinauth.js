var crypto = require('crypto')
  , TOKEN = 'dxhackers';

var isValidWeixinRequest = function(signature, timestamp, nonce){
  var arr = [TOKEN, timestamp, nonce];
  arr.sort();

  return crypto.createHash('sha1').update(arr.join('')).digest('hex') === signature;
}

module.exports = function(req, res, next){
	if ( isValidWeixinRequest(req.query.signature, req.query.timestamp, req.query.nonce)){
    	console.log('validation passed');
    	next();
 	}else{
    	res.send('You dont pass the validation'); //没有通过微信服务器的验证，可能是微信服务器出错或者恶意请求
  }
} 
