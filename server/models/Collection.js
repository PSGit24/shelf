const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: "📁" }, // Normalized from emoji
  isPublic: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // NULL for system/public collections? Or system user identifier?
  count: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Ensure a user cannot have two collections with the same name
collectionSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Collection', collectionSchema);
