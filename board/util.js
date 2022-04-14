var util = {};

// pareseError 함수를 module로 생성합니다 (유효성)
util.parseError = function(errors){
  var parsed = {};
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  }
  else if(errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
    parsed.username = { message:'This username already exists!' };
  }
  else {
    parsed.unhandled = JSON.stringify(errors);
  }
  return parsed;
}

// isloggedin 함수를 통해 로그인 여부를 검사합니다.
util.isLoggedin = function(req, res, next){
  if(req.isAuthenticated()){
    next();
  }
  else {
    req.flash('errors', {login:'Please login first'});
    res.redirect('/login');
  }
}

// nopermission 함수는 접근 권한 여부를 확인합니다.
util.noPermission = function(req, res){
  req.flash('errors', {login:"You don't have permission"});
  req.logout();
  res.redirect('/login');
}

// QueryString으로 처리하는 함수를 생성합니다.
util.getPostQueryString = function(req, res, next){
  res.locals.getPostQueryString = function(isAppended=false, overwrites={}){
    var queryString = '';
    var queryArray = [];
    var page = overwrites.page?overwrites.page:(req.query.page?req.query.page:'');
    var limit = overwrites.limit?overwrites.limit:(req.query.limit?req.query.limit:'');
    var searchType = overwrites.searchType?overwrites.searchType:(req.query.searchType?req.query.searchType:'');
    var searchText = overwrites.searchText?overwrites.searchText:(req.query.searchText?req.query.searchText:'');

    if(page) queryArray.push('page='+page);
    if(limit) queryArray.push('limit='+limit);
    if(searchType) queryArray.push('searchType='+searchType);
    if(searchText) queryArray.push('searchText='+searchText);

    if(queryArray.length>0) queryString = (isAppended?'&':'?') + queryArray.join('&');

    return queryString;
  }
  next();
}

// Comment에 대한 대댓글 함수입니다.
util.convertToTrees = function(array, idFieldName, parentIdFieldName, childrenFieldName){
  var cloned = array.slice();

  for(var i=cloned.length-1; i>-1; i--){
    var parentId = cloned[i][parentIdFieldName];

    if(parentId){
      var filtered = array.filter(function(elem){
        return elem[idFieldName].toString() == parentId.toString();
      });

      if(filtered.length){
        var parent = filtered[0];

        if(parent[childrenFieldName]){
          parent[childrenFieldName].unshift(cloned[i]);
        }
        else {
          parent[childrenFieldName] = [cloned[i]];
        }

      }
      cloned.splice(i,1);
    }
  }

  return cloned;
}

// byte를 KB, MB로 고쳐서 표시해줍니다.
 util.bytesToSize = function(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

module.exports = util;
