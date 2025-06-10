const mongoose = require("mongoose");
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/appDb', { dbName: "formatter" });
        console.log("Database connection is ready....");
    } catch (err) {
        console.log("error: ", err);
    }
};

module.exports = connectDB;
