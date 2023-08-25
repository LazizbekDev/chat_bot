const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  contactId: {
    type: String,
    required: true,
  },

  partnerId: {
    type: String,
    default: null,
  },

  status: {
    type: Number,
    default: 0,
  },

  username: {
    type: String,
    default: null
  },

  age: {
    type: Number,
    default: null
  },

  gender: {
    type: String,
    enum: ['m', 'f'],
  },

  country: {
    type: String,
    default: "hidden"
  }
});

module.exports = mongoose.model("Contact", contactSchema);
