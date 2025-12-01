const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin','technician','resident'], default: 'resident' },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

UserSchema.methods.setPassword = async function(pw){
  this.passwordHash = await bcrypt.hash(pw, 10);
};
UserSchema.methods.validatePassword = async function(pw){
  return bcrypt.compare(pw, this.passwordHash);
};
UserSchema.methods.toJSON = function(){
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
