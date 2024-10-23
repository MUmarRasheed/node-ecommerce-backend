const config                                                = require("config");
const path                                                  = require("path");
const nodemailer                                            = require("nodemailer");

async function sendEmail(to, from, html, data, attachments, subject, text) {
  var transporter = nodemailer.createTransport({
    port: 587, // STARTTLS port
    service: "gmail",
    secure: false,
    auth: {
      user: config.mailEmail, // Your SMTP user name
      pass: config.mailPassword, // Your SMTP password
    },
  });

  let payload = {
    from: from,
    to: to,
    subject: subject,
    text: text,
    html: html,
    data: data,
  };
  if (attachments && attachments.length !== 0) {
    payload.attachments = attachments;
  }

  let info = await transporter.sendMail(payload);
  console.log("Email Sent Successfully", info);

  return info;
}

module.exports = sendEmail;
