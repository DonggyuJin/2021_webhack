const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    id: {
      type: String,
      maxlength:50
    },
    password: {
      type: String,
      minglength: 50
    },
    name: {
      type: String,
      maxlength: 10
    },
    role : {
      type: Number,
      default: 0
    },
})

const Admin = mongoose.model('Admin', adminSchema);

module.exports = { Admin }