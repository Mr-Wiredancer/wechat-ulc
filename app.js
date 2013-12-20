
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , weixinAuth = require('./middlewares/weixinauth.js')
  , weixinMessageBuilder = require('./middlewares/weixinmessagebuilder.js')
  , identityChecker = require('./middlewares/identitychecker.js')
  , sysCommandHandler = require('./middlewares/syscommand.js')
  , weixinSession = require('./middlewares/weixinsession.js')
  , weixin = require('./controllers/weixin.js');

var app = express()
  // , APPID = 'wx536ca9a0d796f541'
  , APPID = 'wx07031480fe88fbf6' //TEST ACCOUNT
  // , APPSECRET = '6b02a04187dcc4567f0f683a5e081773'
  , APPSECRET = 'f73012337cad2ab2a8008cb27b54775c'
  , requestify = require('requestify');



var updateAccessToken = function(){
  requestify.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+APPID+'&secret='+APPSECRET).then(function(response){
      var token = response.getBody()['access_token'];
      if (token){
        app.set('ACCESSTOKEN', token);
      }
      console.log(token);
  });
};

app.set('ACCESSTOKEN', '');
updateAccessToken();
setInterval(updateAccessToken, 7100*1000);
// var uristring =
// process.env.MONGOLAB_URI ||
// process.env.MONGOHQ_URL ||
// 'mongodb://localhost/HelloMongoose';

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// app.get('/', routes.index);
// app.get('/users', user.list);

app.get('/weixin', weixin.test);

app.post('/weixin', [weixinAuth, weixinMessageBuilder, identityChecker, sysCommandHandler, weixinSession(app)],  weixin.post);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
