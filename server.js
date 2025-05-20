
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

  const payload = {
    to: TARGET_GROUP_ID,
    messages: [
      { type: "text", text: `📌 提醒人：${name}
📂 分類：${mainCategory} / ${subCategory} / ${subSubCategory || "-"}
🗓 提醒日期：${time}
📨 內容：${message}` }
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

  res.send(`<script>alert("✅ 提醒建立成功！"); window.location.href='/reminders';</script>`);
});

app.get("/api/reminders", async (req, res) => {
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  const data = rows.map(row => ({
    id: row.id,
    name: row.name,
    mainCategory: row.mainCategory,
    subCategory: row.subCategory,
    subSubCategory: row.subSubCategory,
    time: row.time,
    message: row.message,
    repeatType: row.repeatType,
    expireDate: row.expireDate,
    createdBy: row.createdBy,
    lastSent: row.lastSent,
  }));

  res.json(data);
});

app.delete("/api/reminders/:id", async (req, res) => {
  const targetId = req.params.id;

  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  const targetRow = rows.find(row => row.id === targetId);
  if (targetRow) {
    await targetRow.delete();
    res.send({ success: true });
  } else {
    res.status(404).send({ success: false, message: "提醒不存在" });
  }
});


app.get("/push", async (req, res) => {
  try {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const taiwanTime = new Date(utc + (8 * 60 * 60000)); // 台灣 GMT+8

    const hour = taiwanTime.getHours();
    const minute = taiwanTime.getMinutes();
    const isWeekday = taiwanTime.getDay() >= 1 && taiwanTime.getDay() <= 5;

    const todayStr = taiwanTime.toISOString().slice(0, 10);
    const tomorrowStr = new Date(taiwanTime.getTime() + 86400000).toISOString().slice(0, 10);

    const isMorning = hour === 8 && minute <= 10;
    const isAfternoon = hour === 16 && minute >= 50 && minute <= 59;

    if (!isMorning && !isAfternoon) {
      return res.send("⏱ 尚未進入推播時段（08:00~08:10 或 16:50~17:00）");
    }

    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    let pushedCount = 0;

    for (const row of rows) {
      const reminderDateStr = row.time;
      const expireDate = new Date(row.expireDate || row.time);
      const reminderDate = new Date(reminderDateStr);
      const isExpired = taiwanTime > expireDate;

      if (isExpired || !row.name || !row.message) continue;

      let shouldSend = false;
      if (isMorning && reminderDateStr === todayStr) {
        shouldSend = true;
      } else if (isAfternoon && reminderDateStr === tomorrowStr) {
        shouldSend = true;
      }

      if (isWeekday && shouldSend) {
        const msg = `📌 提醒人：${row.name}
📂 分類：${row.mainCategory} / ${row.subCategory} / ${row.subSubCategory || "-"}
🗓 提醒日期：${row.time}
📨 內容：${row.message}`;

        await axios.post("https://api.line.me/v2/bot/message/push", {
          to: TARGET_GROUP_ID,
          messages: [{ type: "text", text: msg }]
        }, {
          headers: {
            "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          }
        });

        row.lastSent = todayStr;
        await row.save();
        pushedCount++;
      }
    }

    res.send(`✅ ${isMorning ? "上午" : "下午"}推播完成，共發送 ${pushedCount} 則提醒。`);
  } catch (err) {
    console.error("❌ 推播錯誤", err);
    res.status(500).send("❌ 推播失敗：" + (err.response?.data || err.message));
  }
});


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
