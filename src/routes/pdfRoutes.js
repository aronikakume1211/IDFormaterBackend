const express = require("express");
const router = express.Router();
const pdfController = require("../controllers/pdfController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const personSchema = require("../models/person.schema");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (_, __, cb) {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: function (_, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (_, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});


// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware to log requests
router.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware to clear the upload directory before each upload
router.use("/process", (req, res, next) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("Failed to read upload directory", err);
      return next(err);
    }
    for (const file of files) {
      fs.unlink(path.join(uploadDir, file), err => {
        if (err) {
          console.error("Failed to delete file", err);
          return next(err);
        }
      });
    }
    next();
  });
});

// Process a PDF file upload
router.post(
  "/process",
  upload.single("file"),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded or invalid file type");
    }
    next();
  },
  pdfController.processUploadedPdf
);

// Process a PDF by filename (already on server)
router.get("/process/:filename", pdfController.processExistingPdf);

router.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send(err.message);
});

// Get Processed PDF data
router.get("/nationalId", async (req, res) => {
  try {
    const persons = await personSchema.find();
    res.send({ status: "ok", persons });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send({ error: "Failed to fetch data" });
  }
});

module.exports = router;
