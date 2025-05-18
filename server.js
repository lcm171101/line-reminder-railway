const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: "/etc/secrets/inxtip-89eabe38b19b.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});
const LINE_TOKEN = process.env.LINE_TOKEN || "mSBsmayCI1bFn4y/GtDahO+tqnkjq8z1thvvHKmJkOSgWheU4BMJ9689bMOUIYPNgH4S4rLMoZjxpGEc6OOut7MiHEnnlK4o7eiGmOOd/GJZAlTVgE4FRubH2+fuZWQcVe6DzTyvWUeKrhwsb0TJhAdB04t89/1O/w1cDnyilFU=";
const GROUP_ID = "C9303cfa645cd5bc8b650c8a442010ccd";

const sheetId = "1IQ9SCpBc3eWNfz3wfZYsRIHE0sUwNfZQMBb2UpcSqRo";

// Serve static pages
app.get("/form", (req, res) => res.sendFile(__dirname + "/form.html"));
app.get("/reminders", (req, res) => res.sendFile(__dirname + "/reminders.html"));

// Get all reminders
app.get("/api/reminders", async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "工作表1!A2:L"
  });
  const rows = result.data.values || [];
  const data = rows.map((row, index) => ({
    rowIndex: index + 2,
    id: row[0], name: row[1], mainCategory: row[2], subCategory: row[3],
    time: row[4], message: row[5], repeatType: row[6],
    repeatParam: row[7], expireDate: row[8], createdBy: row[9], subSubCategory: row[8],
    expireDate: row[9], createdBy: row[10], lastSent: row[11]
  }));
  res.json(data);
});

// Get single reminder by ID
app.get("/api/reminders/:id", async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "工作表1!A2:L"
  });
  const rows = result.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === req.params.id) {
      const r = rows[i];
      return res.json({
        rowIndex: i + 2,
        id: r[0], name: r[1], mainCategory: r[2], subCategory: r[3],
        time: r[4], message: r[5], repeatType: r[6],
        repeatParam: r[7], expireDate: r[8], createdBy: r[9], subSubCategory: r[8],
    expireDate: r[9], createdBy: r[10], lastSent: r[11]
      });
    }
  }
  res.status(404).send("Not found");
});

// Update reminder
app.put("/api/reminders/:id", async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "工作表1!A2:L"
  });
  const rows = result.data.values || [];
  let found = false;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === req.params.id) {
      const rowIndex = i + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `工作表1!A${rowIndex}:K${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            req.params.id,
            req.body.name,
            req.body.mainCategory,
            req.body.subCategory,
            req.body.time,
            req.body.message,
            req.body.repeatType,
            req.body.repeatParam, req.body.subSubCategory,
            req.body.expireDate,
            req.body.createdBy,
            req.body.lastSent || ""
          ]]
        }
      });
      found = true;
      break;
    }
  }
  found ? res.send("✅ 已更新") : res.status(404).send("未找到");
});

// Delete reminder by ID
app.delete("/api/reminders/:id", async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "工作表1!A2:L"
  });
  const rows = result.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === req.params.id) {
      const rowIndex = i + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `工作表1!A${rowIndex}:K${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: { values: [["","","","","","","","","","",""]] }
      });
      return res.send("✅ 已刪除");
    }
  }
  res.status(404).send("未找到");
});

// 建立提醒
app.post("/set-reminder", async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });
    const reminder = {
      id: uuidv4(),
      name: req.body.name,
      mainCategory: req.body.mainCategory,
      subCategory: req.body.subCategory,
      time: req.body.time,
      message: req.body.message,
      repeatType: req.body.repeatType,
      repeatParam: req.body.repeatParam || "",
      expireDate: req.body.expireDate || "",
      createdBy: req.body.createdBy,
      subSubCategory: req.body.subSubCategory || "",
    lastSent: ""
    };
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "工作表1!A2",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [[
        reminder.id, reminder.name, reminder.mainCategory,
        reminder.subCategory, reminder.time, reminder.message,
        reminder.repeatType, reminder.repeatParam, reminder.subSubCategory,
        reminder.expireDate, reminder.createdBy, reminder.lastSent
      ]]},
    });
    
await axios.post("https://api.line.me/v2/bot/message/push", {
  to: GROUP_ID,
  messages: [{
    type: "text",
    text: `🔔 新提醒通知\n👤 ${reminder.name}\n🕐 ${reminder.time}\n📌 ${reminder.mainCategory}/${reminder.subCategory}/${reminder.subSubCategory}\n📝 ${reminder.message}`
  }]
}, {
  headers: {
    Authorization: `Bearer ${LINE_TOKEN}`,
    "Content-Type": "application/json"
  }
});
res.send("✅ 提醒已寫入 Google Sheets 並推播！");

  } catch (err) {
    res.status(500).send("❌ 寫入失敗：" + err.message);
  }
});

app.listen(PORT, () => console.log("Server running."));


app.post("/webhook", (req, res) => {
  const event = req.body.events?.[0];
  if (!event || !event.source) return res.sendStatus(200);

  const source = event.source;
  if (source.groupId) {
    console.log("👉 群組 ID:", source.groupId);
  } else if (source.roomId) {
    console.log("👉 聊天室 ID:", source.roomId);
  } else if (source.userId) {
    console.log("👉 使用者 ID:", source.userId);
  }

  res.sendStatus(200);
});
