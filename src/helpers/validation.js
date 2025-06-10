// Initialize payment
const validatePaymentRequest = (req, res, next) => {
  const { amount, currency, userId, return_url, subscriptionPlan } = req.body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ message: "Invalid or missing amount" });
  }

  if (!currency || typeof currency !== "string") {
    return res.status(400).json({ message: "Invalid or missing currency" });
  }

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "Invalid or missing userId" });
  }

  if (!return_url || typeof return_url !== "string") {
    return res.status(400).json({ message: "Invalid or missing return_url" });
  }

  if (!subscriptionPlan || typeof subscriptionPlan !== "string") {
    return res
      .status(400)
      .json({ message: "Invalid or missing subscriptionPlan" });
  }

  next();
};

module.exports = {
  validatePaymentRequest,
};
