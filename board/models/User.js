var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var passportLocalMongoose = require("passport-local-mongoose");

// 회원가입에 필요한 userSchema 구성
var userSchema = mongoose.Schema({
  username:{
    type:String,
    required:[true,'Username is required!'],
    match:[/^.{4,12}$/,'Should be 4-12 characters!'],
    trim:true,
    unique:true
  },
  password:{
    type:String,
    required:[true,'Password is required!'],
    select:false
  },
  name:{
    type:String,
    required:[true,'Name is required!'],
    match:[/^.{4,12}$/,'Should be 4-12 characters!'],
    trim:true
  },
  email:{
    type:String,
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'Should be a vaild email address!'],
    trim:true
  },
  admin: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
},{
  toObject:{virtuals:true}
});

userSchema.plugin(passportLocalMongoose)

// DB에 save 값 외의 항목 필요시 virtuals 항목으로 생성
userSchema.virtual('passwordConfirmation')
  .get(function(){ return this._passwordConfirmation; })
  .set(function(value){ this._passwordConfirmation=value; });

userSchema.virtual('originalPassword')
  .get(function(){ return this._originalPassword; })
  .set(function(value){ this._originalPassword=value; });

userSchema.virtual('currentPassword')
  .get(function(){ return this._currentPassword; })
  .set(function(value){ this._currentPassword=value; });

userSchema.virtual('newPassword')
  .get(function(){ return this._newPassword; })
  .set(function(value){ this._newPassword=value; });

// password 유효성 검증
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
var passwordRegexErrorMessage = 'Should be minimum 8 characters of alphabet and number combination!';
userSchema.path('password').validate(function(v) {
  var user = this;

  // new user 생성
  if(user.isNew){
    if(!user.passwordConfirmation){
      user.invalidate('passwordConfirmation', 'Password Confirmation is required.');
    }

    if(!passwordRegex.test(user.password)){
      user.invalidate('password', passwordRegexErrorMessage);
    }
    else if(user.password !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }

  // 회원 정보 수정
  if(!user.isNew){
    if(!user.currentPassword){
      user.invalidate('currentPassword', 'Current Password is required!');
    }
    else if(!user.currentPassword, user.originalPassword){
      user.invalidate('currentPassword', 'Current Password is invalid!');
    }

    if(user.newPassword && !passwordRegex.test(user.newPassword)){
      user.invalidate("newPassword", passwordRegexErrorMessage);
    }
    else if(user.newPassword !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }
});

// pw를 hash로
userSchema.pre('save', function (next){
  var user = this;
  if(!user.isModified('password')){
    return next();
  }
  else {
    return next();
  }
});

// bcrypt 모듈로 패스워드 암호화
userSchema.methods.authenticate = function (password) {
  var user = this;
  return password,user.password;
};

// find one user by using username
userSchema.statics.findOneByUsername = function(username) {
  return this.findOne({
      username
  }).exec()
}

// verify the password of the User documment
userSchema.methods.verify = function(password) {
  return this.password === password
}

userSchema.methods.assignAdmin = function() {
  this.admin = true
  return this.save()
}

// model + export
var User = mongoose.model('user',userSchema);
module.exports = User;