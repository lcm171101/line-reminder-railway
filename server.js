
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const reminders = [];

const LINE_TOKEN = process.env.LINE_TOKEN || "請設定你的 LINE Channel Access Token";

function sendLineMessage(to, message) {
  return axios.post("https://api.line.me/v2/bot/message/push", {
    to,
    messages: [{ type: "text", text: message }]
  }, {
    headers: {
      'Authorization': `Bearer ${LINE_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

app.get("/", (req, res) => {
  res.send("LINE Reminder Bot for Railway is running.");
});

app.get("/form", (req, res) => {
  res.sendFile(__dirname + "/form.html");
});

app.post("/set-reminder", (req, res) => {
  const { userId, time, message, repeat } = req.body;
  reminders.push({ userId, time, message, repeat: repeat === "true", lastSent: "" });
  res.send("Reminder set successfully!");
});

app.get("/run-reminder", (req, res) => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentDate = now.toDateString();

  reminders.forEach(reminder => {
    if (reminder.time === currentTime && reminder.lastSent !== currentDate) {
      sendLineMessage(reminder.userId, `提醒您：${reminder.message}`);
      reminder.lastSent = currentDate;
    }
  });

  res.send("Reminders checked.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
