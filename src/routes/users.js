const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");
const { OAuth2Client } = require("google-auth-library");
const paymentSchema = require("../models/payment.schema");
const Person = require("../models/person.schema");

// Env Variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const secret = process.env.SECRET;
const client = new OAuth2Client(CLIENT_ID);

// Get user Lists
router.get("/", async (_req, res) => {
  try {
    const userList = await User.find({}).select("-passwordHash");

    if (!userList || userList.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
    }

    res.status(200).json(userList);
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
});

// Get User by id and update
router.put(`/update/:id`, async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) {
    return res.status(500).json({ success: false, message: "User Not Found" });
  }
  //Update logic
  user.name = req.body.name ?? user.name;
  user.email = req.body.email ?? user.email;
  user.phone = req.body.phone ?? user.phone;
  user.username = req.body.username ?? user.username;
  user.profilePicture = req.body.profilePicture ?? user.profilePicture;
  user.isAdmin = req.body.isAdmin ?? user.isAdmin;
  user.provider = req.body.provider ?? user.provider;
  user.facebookId = req.body.facebookId ?? user.facebookId;
  user.googleId = req.body.googleId ?? user.googleId;

  try {
    const updatedUser = await user.save();
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
});

/**
 * Email Confirmation
 * @param {string} email - The email address to confirm.
 * @param {string} token - The confirmation token.
 */

router.get("/confirm-email", async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isEmailConfirmed = true;
    await user.save();

    res.status(200).json({ message: "Email confirmed successfully" });
  } catch (error) {
    console.error("Error confirming email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Single User
router.get(`/:id`, async (_req, res) => {
  const user = await User.findById(_req.params.id);

  if (!user) {
    return res.status(500).json({ success: false, message: "User Not Found" });
  }
  res.send(user);
});

// Register User
router.post(`/register`, async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      phone,
      isAdmin,
      provider,
      facebookId,
      profilePicture,
    } = req.body;

    let passwordHash = undefined;
    if (provider === "email") {
      if (!password) {
        return res
          .status(400)
          .send("Password is required for email registration.");
      }
      passwordHash = bcrypt.hashSync(password, 10);
    }

    // Check if user already exists by username or email
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: 400,
        message: "User with the same username or email already exists.",
      });
    }

    let user = new User({
      name,
      email,
      username,
      passwordHash,
      phone,
      isAdmin: isAdmin || false,
      provider,
      facebookId,
      profilePicture,
    });

    user = await user.save();

    // 1. Generate a token (valid for 1 hour)
    const token = jwt.sign({ email }, secret, { expiresIn: "1h" });

    // 2. Generate confirmation link
    const confirmationLink = `http://localhost:5173/confirm?token=${token}`;

    if (!user) {
      return res.status(404).send("The user cannot be created");
    }

    res.status(201).send({ email, confirmationLink });
  } catch (error) {
    return res.status(400).send(`The user cannot be created! ${error.message}`);
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { provider, email, password, facebookId } = req.body;
    let user;

    if (provider === "email") {
      user = await User.findOne({ email, isEmailConfirmed: true });
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(400).send("Incorrect email or password!");
      }
    } else {
      return res.status(400).send("Invalid provider.");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      secret,
      { expiresIn: "7d" }
    );

    res.status(200).send({ user: user.email || user.name, token });
  } catch (err) {
    res.status(400).send(`Login failed: ${err}`);
  }
});

// Login With Google
router.post("/google-login", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const userFromGoogle = {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      profilePicture: payload.picture,
      username: `${payload.given_name}.${payload.sub}`,
      provider: "google",
    };

    // Check if user already exists
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = new User(userFromGoogle);
      await user.save();
    }
    // Generate JWT token
    const tokenJwt = jwt.sign(
      {
        userId: user._id,
        isAdmin: user.isAdmin,
      },
      secret,
      { expiresIn: "7d" }
    );

    // Send response
    res.status(200).json({
      message: "ok",
      user: {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        tokenJwt,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

//Get User Count
router.get("/get/count", async (_req, res) => {
  try {
    const userCount = await User.countDocuments();

    if (!userCount) {
      return res
        .status(404)
        .json({ success: false, message: "Issue on your request." });
    }
    res.send({ count: userCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
});

//Delete user by id
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    return res.status(200).json({ success: true, message: "user deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, error: err });
  }
});

// print Counter
router.post("/print-counter/:id", async (req, res) => {
  try {
    const payment = await paymentSchema
      .find({
        user: req.params.id,
        status: "success",
        expiredStatus: false,
      })
      .sort({ createdAt: -1 });

    if (!payment) {
      return res
        .status(404)
        .json({ message: "You need to top up your balance to proceed" });
    }

    const lastPayment = payment[payment.length - 1];

    if (lastPayment.remainingPoints > 0) {
      lastPayment.remainingPoints -= 1;
      if (lastPayment.remainingPoints === 0) {
        lastPayment.expiredStatus = true;
      }

      await lastPayment.save();

    } else {
      return res
        .status(400)
        .json({ message: "You have no available balance. Please add." });
    }

    // Save the passed user data to personSchema
    const personData = req.body;

    const person = new Person({
      ...personData,
      user: req.params.id,
    });

    await person.save();

    res.status(200).json({ count: lastPayment.remainingPoints });
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ message: "You have no Insufficient Balance. Please add." });
  }
});

module.exports = router;
