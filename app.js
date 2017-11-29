// 引入项目所需要的第三方模块
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

// 引入自定义的模块（路由也被封装成一个模块）
var config = require('./modules/config.js');
var index = require('./routes/index');
var users = require('./routes/users');
var articles = require('./routes/articles');
var messages = require('./routes/messages');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs-mate'));
// 设置_layoutFile属性后，不用在每个ejs文件中显示引用<% layout('layout.html')%>
app.locals._layoutFile = 'layout.ejs';

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(config.key));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  // 加密的字符串
  secret: config.key,
  // 是否重新保存
  resave: false,
  saveUninitialized: true,
}))

// 路由入口（本质上是还是管线）
app.use('/', index);
app.use('/users', users);
app.use('/articles', articles);
app.use('/messages', messages);

// catch 404 and forward to error handler
// 404找不到资源
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
// 捕获500错误
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const _ = require('lodash');
// node.js模块中的方法不能直接在ejs视图上使用。
// 把模块导出的方法扩展到app.locals之后，才可以在视图上使用。
_.extend(app.locals, require('./modules/markdown.js'));

module.exports = app;
