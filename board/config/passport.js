// 변수를 request module로 리턴
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');

// user의 id를 session에 저장
// request시 session에서 user object 생성
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findOne({_id:id}, function(err, user) {
    done(err, user);
  });
});

// Local Strategy 설정
// Login시 호출 (DB에서 해당 user 찾아서 비교)
passport.use('local-login',
  new LocalStrategy({
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true
    },
    function(req, username, password, done) {
      User.findOne({username:username})
        .select({password:1})
        .exec(function(err, user) {
          if (err) return done(err);

          if (user && user.authenticate(password)){
            return done(null, user);
          }
          else {
            req.flash('username', username);
            req.flash('errors', {login:'The username or password is incorrect.'});
            return done(null, false);
          }
        });
    }
  )
);

module.exports = passport;