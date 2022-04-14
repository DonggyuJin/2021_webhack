var mongoose = require('mongoose');
var Counter = require('./Counter');

// 자취레시피 게시판에 대한 recipeSchema 생성.
var recipeSchema = mongoose.Schema({
  title:{type:String, required:[true,'Title is required!']},
  body:{type:String, required:[true,'Body is required!']},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
  views:{type:Number, default:0},
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
  numId:{type:Number},
  attachment:{type:mongoose.Schema.Types.ObjectId, ref:'file'},
  createdAt:{type:Date, default:Date.now},
});

recipeSchema.pre('save', async function (next){ // 3
  var post = this;
  if(post.isNew){
    counter = await Counter.findOne({name:'recipe'}).exec();
    if(!counter) counter = await Counter.create({name:'recipe'});
    counter.count++;
    counter.save();
    post.numId = counter.count;
  }
  return next();
});


// model + export
var Recipe = mongoose.model('recipe', recipeSchema);
module.exports = Recipe;
