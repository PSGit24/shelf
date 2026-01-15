const mongoose = require('mongoose');

const userLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  notes: { type: String, default: "" },
  icon: { type: String, default: "" },
  collectionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserCollection',
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserLink', userLinkSchema);
