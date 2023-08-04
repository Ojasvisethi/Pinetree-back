const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const genreOrArtistSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["genre", "artist"],
    required: true,
  },
  isDisabled: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const GenreOrArtist = mongoose.model("GenreOrArtist", genreOrArtistSchema);

module.exports = GenreOrArtist;
