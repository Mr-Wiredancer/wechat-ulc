var TOKEN = 'dxhackers';


/*
{
    "button": [
        {
            "type": "click", 
            "name": "敬请期待", 
            "key": "MORE"
        }, 
        {
            "name": "老师答疑", 
            "sub_button": [
                {
                    "type": "click", 
                    "name": "SAT", 
                    "key": "SAT"
                }, 
                {
                    "type": "click", 
                    "name": "TOEFL", 
                    "key": "TOEFL"
                }, 
                {
                    "type": "click", 
                    "name": "AP", 
                    "key": "AP"
                }
            ]
        }
    ]
}

{
    "button": [
        {
            "name": "托福", 
            "sub_button": [
                {
                    "type": "click", 
                    "name": "阅读", 
                    "key": "TR"
                }, 
                {
                    "type": "click", 
                    "name": "听力", 
                    "key": "TL"
                }, 
                {
                    "type": "click", 
                    "name": "口语", 
                    "key": "TS"
                },
                {
                    "type": "click", 
                    "name": "写作", 
                    "key": "TW"
                }
            ]
        },
        {
            "name": "雅思", 
            "sub_button": [
                {
                    "type": "click", 
                    "name": "阅读", 
                    "key": "IR"
                }, 
                {
                    "type": "click", 
                    "name": "听力", 
                    "key": "IL"
                }, 
                {
                    "type": "click", 
                    "name": "口语", 
                    "key": "IS"
                },
                {
                    "type": "click", 
                    "name": "写作", 
                    "key": "IW"
                }
            ]
        },
        {
            "name": "SAT", 
            "sub_button": [
                {
                    "type": "click", 
                    "name": "语法", 
                    "key": "SG"
                }, 
                {
                    "type": "click", 
                    "name": "写作", 
                    "key": "SW"
                }, 
                {
                    "type": "click", 
                    "name": "阅读", 
                    "key": "SR"
                },
                {
                    "type": "click", 
                    "name": "词汇", 
                    "key": "SV"
                },
                {
                    "type": "click", 
                    "name": "数学", 
                    "key": "SM"
                }
            ]
        }
    ]
}

*/

exports.post = function(req, res){
  res.send('');
  return;
}

//微信的服务器配置测试
exports.test = function(req, res){
  console.log(next);
	if ( isValidWeixinRequest(req.query.signature, req.query.timestamp, req.query.nonce)){
    res.send(req.query.echostr);
 	}else{
    res.send('you didnt pass the validation');
  } 
}

//开发者验证流程： 将timestamp, nonce和TOKEN字典排序后生成的SHA1 Hash和signature匹配
var isValidWeixinRequest = function(signature, timestamp, nonce){
  var arr = [TOKEN, timestamp, nonce];
  arr.sort();

  return crypto.createHash('sha1').update(arr.join('')).digest('hex') === signature;
}
