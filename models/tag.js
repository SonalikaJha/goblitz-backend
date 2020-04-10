const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    tag: String,
    status: {
        type: Boolean,
        default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Tag', tagSchema);
