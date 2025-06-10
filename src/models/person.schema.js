const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  images: { type: [String], required: false }, // Array of image paths
});

const personSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  fcn_id: { type: String, required: true },
  name_am: { type: String, required: true },
  name_en: { type: String, required: true },
  dob_ethiopian: { type: String, required: true },
  dob_gregorian: { type: String, required: true },
  gender_am: { type: String, required: true },
  gender_en: { type: String, required: true },
  nationality_am: { type: String, required: true },
  nationality_en: { type: String, required: true },
  phone: { type: String, required: true },
  city_am: { type: String, required: true },
  city_en: { type: String, required: true },
  sub_city_am: { type: String, required: true },
  sub_city_en: { type: String, required: true },
  woreda_am: { type: String, required: true },
  woreda_en: { type: String, required: true },
  am_expired: { type: String, required: true },
  am_issueDate: { type: String, required: true },
  en_expired: { type: String, required: true },
  en_issueDate: { type: String, required: true },
  images: { type: imageSchema, required: true }, // Embedding image schema
});

module.exports = mongoose.model("Person", personSchema);
