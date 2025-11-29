const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const user = require("./user.js");
// const { ref } = require("joi");

const reviewSchema = new Schema({
  comment: {
    type: String,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});
const review = mongoose.model("review", reviewSchema);
module.exports = review;
