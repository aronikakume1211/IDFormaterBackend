const usedRefs = new Map();
const validateTransactionReference = (tx_ref) => {

  const EXPIRATION_MINUTES = 10;
  const expiresAt = Date.now() + EXPIRATION_MINUTES * 60 * 1000;
  usedRefs.set(tx_ref, { used: false, expiresAt });
  const refData = usedRefs.get(tx_ref);

  if (!refData) {
    throw new Error("Invalid or expired transaction reference");
  }

  if (refData.used) {
    throw new Error("Transaction already finalized");
  }

  if (Date.now() > refData.expiresAt) {
    usedRefs.delete(tx_ref);
    throw new Error("Transaction reference expired");
  }
};

module.exports = {
  validateTransactionReference,
};
