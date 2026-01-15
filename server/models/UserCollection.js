const mongoose = require('mongoose');

const userCollectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: "📁" },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

// Each user can only have one collection with a given name
userCollectionSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('UserCollection', userCollectionSchema);
