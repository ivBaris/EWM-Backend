const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const eventSchema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  image: { type: String, required: true },
  potParticipants: [
    {
      type: String,
      required: true,
    },
  ],
  participants: [
    {
      type: String,
      default: [null],
    },
  ],
  creatorId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Event", eventSchema);
