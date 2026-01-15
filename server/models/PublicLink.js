const mongoose = require('mongoose');

const publicLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  notes: { type: String, default: "" },
  icon: { type: String, default: "" },
  collectionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PublicCollection',
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PublicLink', publicLinkSchema);
