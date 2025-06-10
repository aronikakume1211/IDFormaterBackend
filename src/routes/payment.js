const express = require("express");
const router = express.Router();
const Payment = require("../models/payment.schema");
const User = require("../models/user.schema");
const { default: axios } = require("axios");
const crypto = require("crypto");
const { validatePaymentRequest } = require("../helpers/validation");

const CHAPA_SECK_KEY = process.env.CHAPA_SECK_KEY;
const subscriptionSecret = process.env.SUBSCRIPTION_SECRET;

// Get user Lists
router.get("/:id", async (_req, res) => {
  try {
    const paymentList = await Payment.find({
      user: _req.params.id,
      status: "success",
    })
      .select("-user")
      .limit(100)
      .sort({ createdAt: -1 });

    if (!paymentList || paymentList.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No payments found" });
    }

    res.status(200).json({ paymentList });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
});

router.post("/", validatePaymentRequest, async (req, res) => {
  const { amount, currency, userId, return_url, subscriptionPlan } = req.body;

  const user = await User.findById(userId).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { email, name, username } = user;
  const tx_ref = `addissoftware-${name.split(" ")[0].toLowerCase()}-${Date.now()}`;

  const planMapping = {
    1000: "basic",
    1800: "enterprise",
    2400: "pro",
  };

  if (!planMapping[amount]) {
    return res.status(400).json({ message: "Invalid subscription amount" });
  }

  if (subscriptionPlan && subscriptionPlan !== planMapping[amount]) {
    return res
      .status(400)
      .json({ message: "Amount and subscription plan do not match" });
  }

  try {
    const header = {
      headers: {
        Authorization: `Bearer ${CHAPA_SECK_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const hash = crypto
      .createHmac("sha256", subscriptionSecret)
      .update(subscriptionPlan)
      .digest("hex");

    const query = new URLSearchParams({
      tx_ref,
      subscriptionPlan,
      hash,
    }).toString();

    const body = {
      amount,
      currency,
      email,
      first_name: name?.split(" ")[0],
      last_name: name?.split(" ")[1],
      tx_ref,
      return_url: `${return_url}?${query}`, // use client return_url
    };

    // 1. Call Chapa
    const response = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      body,
      header
    );

    const chapaData = response.data.data;

    // 2. Save payment immediately with "pending" status
    let points = 0;
    switch (subscriptionPlan) {
      case "basic":
        points = 50;
        break;
      case "enterprise":
        points = 100;
        break;
      case "pro":
        points = 150;
        break;
    }

    const payment = await Payment.savePayment({
      user: userId,
      method: "chapa",
      amount,
      status: "pending", // status is pending until webhook confirms
      subscriptionPlan,
      points,
      remainingPoints: points,
      reference: tx_ref,
      description: "Chapa Payment Initialized",
    });

    return res.status(200).json({
      message: "Payment initialized and saved.",
      chapa_checkout_url: chapaData.checkout_url,
      tx_ref,
    });
  } catch (e) {
    console.error("Error initializing payment:", e);
    res.status(400).json({
      error_code: e.code,
      message: e.message,
    });
  }
});

/**
 * Payment webhook
 *
 *  */
router.post("/webhook", async (req, res) => {
  const event = req.body;
  try {
    if (req.headers["x-chapa-signature"]) {
      const { tx_ref, status, amount,payment_method } = event;
      console.log(event)

      // Update payment record in DB
      await Payment.savePayment({
        method: payment_method,
        amount: amount,
        status: status,
        reference: tx_ref,
      });

      console.log("✅ Payment updated from webhook:", tx_ref, status);

      return res.sendStatus(200);
    } else {
      console.warn("❌ Invalid webhook signature");
      return res.status(400).send("Invalid signature");
    }
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
