const mongoose = require("mongoose");

//User Schema
const adminSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

adminSchema.virtual("id").get(() => {
  return this._id?.toHexString();
});

adminSchema.set("toJSON", {
  virtuals: true,
});


// user model
module.exports = mongoose.model("Admin", adminSchema);
