const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
    },
    points: {
      type: Number,
      default: function () {
        switch (this.subscriptionPlan) {
          case "basic":
            return 10;
          case "enterprise":
            return 100; // Unlimited points
          case "pro":
            return 150;
          default:
            return 0;
        }
      },
    },
    remainingPoints: {
      type: Number,
      default: function () {
        return this.points;
      },
    },
    subscriptionPlan: {
      type: String,
      enum: ["basic", "enterprise", "pro"],
    },
    expiredStatus: {
      type: Boolean,
      default: false,
    },
    method: {
      type: String,
      enum: [],
      default: "chapa",
    },

    status: {
      type: String,
      enum: ["pending", "success", "refunded", "reversed", "failed/cancelled"],
      default: "pending",
    },
    expiredDate: {
      type: Date,
      default: function () {
        const createdAt = this.createdAt || new Date();
        return new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days
      },
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
    },

    invoice: {
      type: String,
      unique: true,
      default: function () {
        return `#${String(Date.now()).slice(-6)}`;
      },
    },
    notified75: {
      type: Boolean,
      default: false,
    },
    notified100: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.virtual("id").get(function () {
  return this._id?.toHexString();
});

paymentSchema.set("toJSON", {
  virtuals: true,
});

paymentSchema.statics.savePayment = async function (paymentData) {
  const { reference } = paymentData;

  const existingPayment = await this.findOne({ reference });

  if (!existingPayment) {
    const newPayment = new this(paymentData);
    await newPayment.save();
    return newPayment;
  }

  const updatedData = { ...paymentData };
  if (existingPayment.status !== "pending") {
    updatedData.status = existingPayment.status;
  }

  const updatedPayment = await this.findOneAndUpdate(
    { reference },
    updatedData,
    { new: true }
  );
  return updatedPayment;
};

module.exports = mongoose.model("Payment", paymentSchema);
