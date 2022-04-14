var dotenv = require('dotenv');
dotenv.config();

// 각종 패키지를 불러옵니다 (bodyparser, express-session, connect-mongo 등)
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('./config/passport');
const util = require('./util');
var app = express();
var MongoStore = require('connect-mongo');
var path = require('path');
var helmet = require('helmet');

const https = require('https');
const sslConfig = require('./config/ssl-config');

// SSL setting
const options = {
  key: sslConfig.privateKey,
  cert: sslConfig.certificate,
  passphrase: 'qwer1234' // certificate을 생성하면서 입력하였던 passphrase 값
};

// DB 설정 관련 부분입니다.
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGO_DB);
var db = mongoose.connection;
db.once('open', function(){
  console.log('DB connected');
});
db.on('error', function(err){
  console.log('DB ERROR : ', err);
});



// resolve middleware
app.set('view engine', 'ejs');
app.use(flash());
app.use(session({
  secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: true, 
    }, 
  resave:true, 
  saveUninitialized:true,
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://webtest8:webtest1234~@cluster0.cmale.mongodb.net/webtest8?retryWrites=true&w=majority',
    collection: 'users'
  })
}));

// Passport 설정입니다.
app.use(passport.initialize());
app.use(passport.session());

// 추가적인 middle ware 입니다 (로그인 판단 여부 확인)
app.use(function(req,res,next){
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  res.locals.util = util;
  next();
});

// adminbro 이후 bodyparser + bodyparser 이후 routes
app.use('/admin', require('./routes/admin'));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname + '/public')));
app.use(express.json());
app.use(methodOverride('_method'));

// Routes (Express middle ware)
app.use('/', require('./routes/home'));
app.use('/posts', require('./routes/posts'));
app.use('/recipe', util.getPostQueryString, require('./routes/recipe'));
app.use('/comments', util.getPostQueryString, require('./routes/comments'));
app.use('/files', require('./routes/files'));
app.use('/users', require('./routes/users'));
app.use('/find', require('./routes/find'));
app.use('/forgot', require('./routes/forgot'));

// Port 설정 ('https://localhost:3000' 주소를 open 합니다.)
const server = https.createServer(options, app);
var port = 3000;
server.listen(port, function(){
  console.log('server on! https://localhost:'+port);
});

const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/user');

var io = require('socket.io')(server);
 
app.get("/anonymous", function(req, res, next) { // express 서버의 / (root 경로) 에 request가 들어오면, 
  res.sendFile(__dirname + '/chat/index.html'); // response로 "index.html" 를 전송 
}) 

app.get("/chat", function(req, res, next) { // express 서버의 / (root 경로) 에 request가 들어오면, 
  res.sendFile(__dirname + '/chat/chat.html'); // response로 "chat.html" 를 전송 
}) 

const botName = 'GenT Bot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, '환영합니다!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} 님이 입장하셨습니다.`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} 님이 나가셨습니다.`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});