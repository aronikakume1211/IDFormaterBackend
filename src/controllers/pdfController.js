const ProcessedPerson = require("../models/processed.person");
const pdfService = require("../services/pdfService");
const path = require("path");
const {
  enExpirDate,
  enIssueDate,
  expiryEthiopian,
  todayEthiopian,
} = require("../utils/dateUtils");

/**
 * Process a PDF file that was uploaded through the API
 */
exports.processUploadedPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded",
      });
    }

    const pdfPath = req.file.path;

    // Process the PDF using the Python script
    const result = await pdfService.processPdf(pdfPath);
    result[0].am_expired = expiryEthiopian();
    result[0].am_issueDate = todayEthiopian();
    result[0].en_expired = enExpirDate();
    result[0].en_issueDate = enIssueDate();

    const saveExtractedData = async () => {
      try {
        // Loop through the result array
        for (const data of result) {
          const personData = {
            fcn_id: data.fcn_id,
            name_en: data.name_en,
            gender_en: data.gender_en,
            phone: data.phone,
            city_en: data.city_en,
            sub_city_en: data.sub_city_en,
            woreda_en: data.woreda_en,
            processed_date: data.en_issueDate,
            user: req.auth.userId,
          };

          // Create and save the person document
          const Processed = new ProcessedPerson(personData);
          await Processed.save();
        }

      } catch (error) {
        console.error("Error processing person(s):", error);
      }
    };

    // Call the function to save the data
    saveExtractedData();

    return res.status(200).json({
      success: true,
      result: result[0],
    });
  } catch (error) {
    console.error("Error processing uploaded PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing PDF",
      error: error.message,
    });
  }
};

/**
 * Process a PDF file that already exists on the server
 */
exports.processExistingPdf = async (req, res) => {
  try {
    const filename = req.params.filename;

    if (filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const pdfPath = path.join(__dirname, "../../", filename);
    const result = await pdfService.processPdf(pdfPath);
    result[0].am_expired = expiryEthiopian();
    result[0].am_issueDate = todayEthiopian();
    result[0].en_expired = enExpirDate();
    result[0].en_issueDate = enIssueDate();
    console.log("Extracted data:", result);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error processing existing PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing PDF",
      error: error.message,
    });
  }
};
