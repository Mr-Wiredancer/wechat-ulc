
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
  , weixin = require('./controllers/weixin.js');

var app = express();

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

app.post('/weixin', [weixinAuth, weixinMessageBuilder, identityChecker],  weixin.post);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
