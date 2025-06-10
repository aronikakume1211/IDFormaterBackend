const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
 try {
    console.log("Send to: ",to)
     const transporter = nodemailer.createTransport({
       service: "Gmail", // or use SMTP config
       auth: {
         user: process.env.EMAIL_USER,
         pass: process.env.EMAIL_PASS,
       },
     });
   
     await transporter.sendMail({
       from: `"Fayda Print" <${process.env.EMAIL_USER}>`,
       to,
       subject,
       html,
     });
 } catch (error) {
    console.log("Error: ",error)
 }
};

module.exports = sendEmail;
