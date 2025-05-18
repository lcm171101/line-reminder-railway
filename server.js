
const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

const doc = new GoogleSpreadsheet("1IQ9SCpBc3eWNfz3wfZYsRIHE0sUwNfZQMBb2UpcSqRo");
const creds = require("./inxtip-89eabe38b19b.json");

const LINE_CHANNEL_ACCESS_TOKEN = "mSBsmayCI1bFn4y/GtDahO+tqnkjq8z1thvvHKmJkOSgWheU4BMJ9689bMOUIYPNgH4S4rLMoZjxpGEc6OOut7MiHEnnlK4o7eiGmOOd/GJZAlTVgE4FRubH2+fuZWQcVe6DzTyvWUeKrhwsb0TJhAdB04t89/1O/w1cDnyilFU=";
const TARGET_GROUP_ID = "C9303cfa645cd5bc8b650c8a442010ccd";

app.get("/form", (req, res) => {
  res.sendFile(__dirname + "/form.html");
});

app.get("/reminders", async (req, res) => {
  res.sendFile(__dirname + "/reminders.html");
});

app.post("/set-reminder", async (req, res) => {
  const {
    name, mainCategory, subCategory, subSubCategory, time,
    message, repeatType, repeatParam, expireDate, createdBy
  } = req.body;

  const id = uuidv4();

  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  await sheet.addRow([
    id, name, mainCategory, subCategory, subSubCategory,
    time, message, repeatType, repeatParam, expireDate, createdBy, ""
  ]);

  const today = new Date();
  const day = today.getDay();
  const hour = today.getHours();
  const exp = new Date(expireDate);
  const noticeStart = new Date(exp);
  noticeStart.setDate(exp.getDate() - 2);

  const shouldSend =
    day >= 1 && day <= 5 &&
    hour === 8 &&
    today >= noticeStart &&
    today <= exp;

  if (shouldSend) {
    const payload = {
      to: TARGET_GROUP_ID,
      messages: [
        { type: "text", text: `🔔 ${name} 提醒事項：${message}` }
      ]
    };

    axios.post("https://api.line.me/v2/bot/message/push", payload, {
      headers: {
        "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    })
    .then(res => {
      console.log(`[推播成功] 給 ${payload.to}：${payload.messages[0].text}`);
    })
    .catch(err => {
      console.error(`[推播失敗]`, err.response?.data || err.message);
    });
  }

  res.send(`<script>alert("✅ 提醒建立成功！"); window.location.href='/reminders';</script>`);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
