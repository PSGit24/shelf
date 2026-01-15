const mongoose = require('mongoose');

const publicCollectionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, default: "📁" },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PublicCollection', publicCollectionSchema);
