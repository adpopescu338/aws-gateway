const fs = require("fs");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");

const MAX_RESETS = 5;

const sendOtpEmail = async (email) => {
  // generate otp
  const otp = Math.floor(100000 + Math.random() * 900000);

  const users = JSON.parse(fs.readFileSync("./data.json", "utf8"));

  const user = users.find((user) => user.email === email);

  if (user && user.resets >= MAX_RESETS) {
    throw new Error("Maximum resets reached");
  }

  if (!user) {
    // generate token
    const token = crypto.randomBytes(20).toString("hex");

    const newUser = {
      id: crypto.randomBytes(20).toString("hex"),
      email,
      otp,
      createdDate: new Date(),
      resetDate: new Date(),
      token,
      ip: "",
      resets: 0,
    };

    users.push(newUser);
    fs.writeFileSync("./data.json", JSON.stringify(users));
  } else {
    user.otp = otp;
    user.resetDate = new Date();
    user.resets = user.resets + 1;
    fs.writeFileSync("./data.json", JSON.stringify(users));
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: email,
    from: process.env.SENDER_EMAIL,
    subject: "OTP for login",
    text: `Your OTP is ${otp}`,
    html: `<strong>Your OTP is ${otp}</strong>`,
  };

  try {
    await sgMail.send(msg);
  } catch (e) {
    throw new Error("Error sending email");
  }
};

module.exports = sendOtpEmail;
