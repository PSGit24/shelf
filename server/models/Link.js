const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
  },
  url: {
    type: String,
    required: [true, "Please add a URL"],
  },
  category: {
    type: String,
    default: "Uncategorized",
  },
  notes: {
    type: String,
    default: "",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ""
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }
}, {
  timestamps: true,
});

const Link = mongoose.model("Link", linkSchema);

module.exports = Link;
