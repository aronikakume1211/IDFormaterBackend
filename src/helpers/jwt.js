const { expressjwt: jwt } = require("express-jwt"); // Note the destructuring

function authJwt() {
  const secret = process.env.SECRET;
  return jwt({
    secret,
    algorithms: ["HS256"],
    // isRevoked: async(req,token)=>!token?.payload?.isAdmin //If isAdmin is false or undefined, !token?.payload?.isAdmin becomes true, and the token is revoked.
  }).unless({
    path: [
      // Public routes that don't require authentication
      { url: /\/public\/images(.*)/, methods: ["GET", "OPTIONS"] },
      "/api/v1/users/login",
      "/api/v1/users/register",
      "/api/process",
      "/api/v1/payment/webhook",
      "/api/v1/users/google-login",
      "/api/v1/users/confirm-email"

    ],
  });
}


module.exports = authJwt;
