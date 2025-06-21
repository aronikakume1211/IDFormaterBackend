const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const cron = require("node-cron");
const bcrypt = require("bcryptjs");
// const bodyParser = require("body-parser");
const connectDB = require("./config/db");
require("dotenv/config");

// Import routes
const pdfRoutes = require("./routes/pdfRoutes");
const usersRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payment");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/errorHandler");
const notifyUsersWithLowPoints = require("./controllers/pointNotifier");
const setupAdmin = require("./admin/adminbro");
const adminShcema = require("./models/admin.shcema");

const app = express();
const PORT = process.env.PORT || 4444;

// Middleware
app.use(cors({
  origin: ["http://localhost:5174", "https://idformatter.netlify.app"],
  credentials: true,
}));
app.use(morgan("dev"));


// Serve static files from the public directory
app.use("/images", express.static(path.join(process.cwd(), "public/images")));

const api = process.env.API_URL;


// Database connection + Admin setup
connectDB()
  .then(async () => {
    // const users = JSON.parse(process.env.ADMIN_USERS || "[]");
    // console.log("users: ", users);

    // for (const user of users) {
    //   const existingAdmin = await adminShcema.findOne({ email: user.email });

    //   if (!existingAdmin) {
    //     const hash = await bcrypt.hash(user.password, 10);
    //     const admin = new adminShcema({
    //       email: user.email,
    //       passwordHash: hash,
    //       isAdmin: true,
    //     });

    //     await admin.save();
    //   } else {
    //     console.log(`Admin user already exists: ${user.email}`);
    //   }
    // }

    const { adminJs, router } = await setupAdmin();

    app.use(adminJs?.options?.rootPath, router);

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Routes (AFTER body parsing middleware)
    app.use(`${api}`, authJwt(), pdfRoutes);
    app.use(`${api}/users`, authJwt(), errorHandler, usersRoutes);
    app.use(`${api}/payment`, authJwt(), errorHandler, paymentRoutes);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`AdminJS at ${adminJs.options.rootPath}`);

      // Schedule notification job
      cron.schedule("*/10 6-18 * * *", () => {
        notifyUsersWithLowPoints();
      });
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
