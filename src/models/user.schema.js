const mongoose = require("mongoose");

//User Schema
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: function () {
        return this.provider === "email"; 
      },
    },
    isEmailConfirmed: {
      type: Boolean,
      default: function () {
        return this.provider === "google" ? true : false;
      },
    },
    phone: {
      type: String,
    },
    googleId: {
      type: String,
    },
    provider: {
      type: String,
      enum: ["email", "facebook", "google"],
      required: true,
      default: "email",
    },
    passwordHash: {
      type: String,
      required: function () {
        return this.provider === "email";
      },
    },
   
    profilePicture: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("id").get(() => {
  return this._id?.toHexString();
});

userSchema.set("toJSON", {
  virtuals: true,
});

userSchema.virtual("payments", {
  ref: "Payment",
  localField: "_id",
  foreignField: "user",
});


// user model
module.exports = mongoose.model("User", userSchema);
