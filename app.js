const express = require("express");
const sendOtpEmail = require("./sendOtpEmail");
const fs = require("fs");

const app = express();

app.use(express.static("public"));
app.use(express.json());

// update user ip address
app.get("/update/:token", (req, res) => {
  // get token
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: "Invalid token", success: false });
  }

  // get ip address
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const port = req.socket.remotePort;

  console.log({
    ip,
    port,
  });

  const users = JSON.parse(fs.readFileSync("./data.json", "utf8"));
  const user = users.find((user) => user.token === token);

  if (!user) {
    return res.status(400).json({ message: "Invalid token", success: false });
  }

  // update user

  if (user.ip != ip || user.port != port) {
    user.ip = ip;
    user.port = port;

    fs.writeFileSync("./data.json", JSON.stringify(users));
    res
      .status(200)
      .json({ message: "User updated successfully", success: true });
  } else {
    res.status(200).json({ message: "User already updated", success: true });
  }
});

app.all("/get/:userId", (req, res) => {
  const { userId } = req.params;
  const users = JSON.parse(fs.readFileSync("./data.json", "utf8"));
  const user = users.find((user) => user.id === userId);
  if (!user) {
    return res.status(400).json({ message: "User not found", success: false });
  }

  const userAddress = `http://${user.ip}${
    user.port ? `:${Number(user.port)}` : ""
  }}`;

  console.log({
    userAddress,
  });

  // forward request to user ip address
  res.redirect(userAddress);
});

app.post("/register", async (req, res) => {
  const { email } = req.body;
  console.log({
    email,
  });
  try {
    await sendOtpEmail(email);
  } catch (e) {
    console.log(e);
    return res.status(400).json({ message: e.message, success: false });
  }

  res.status(200).json({ message: "OTP sent successfully", success: true });
});

app.post("/verify", (req, res) => {
  const { email, otp } = req.body;
  const users = JSON.parse(fs.readFileSync("./data.json", "utf8"));
  const user = users.find((user) => user.email === email);
  if (!user) {
    return res.status(400).json({ message: "User not found", success: false });
  }
  if (user.otp != otp) {
    return res.status(400).json({ message: "Invalid OTP", success: false });
  }
  res.status(200).json({
    message: "OTP verified successfully",
    success: true,
    data: {
      privateToken: user.token,
      publicToken: user.id,
    },
  });
});

const port = process.env.PORT || 3000;

// check if file ./data.json exists
if (!fs.existsSync("./data.json")) {
  fs.writeFileSync("./data.json", JSON.stringify([]));
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
