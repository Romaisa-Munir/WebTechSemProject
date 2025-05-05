const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  joinedGenres: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Genre',
    }
  ],
  personalLibraries: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Library',
    }
  ],
});

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash the password before saving
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);