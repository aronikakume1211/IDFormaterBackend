const mongoose = require("mongoose");

const processedPersonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  fcn_id: { type: String, required: true },
  name_en: { type: String, required: true },
  gender_en: { type: String, required: true },
  phone: { type: String, required: true },
  city_en: { type: String, required: true },
  sub_city_en: { type: String, required: true },
  woreda_en: { type: String, required: true },
  processed_date: { type: String, required: true },
});

module.exports = mongoose.model("ProcessedPerson", processedPersonSchema);
