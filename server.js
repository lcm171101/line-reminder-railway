const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: "/etc/secrets/inxtip-67731e8601e1.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});
const sheetId = "1IQ9SCpBc3eWNfz3wfZYsRIHE0sUwNfZQMBb2UpcSqRo";

app.get("/form", (req, res) => {
  res.sendFile(__dirname + "/form.html");
});
app.get("/reminders", (req, res) => {
  res.sendFile(__dirname + "/reminders.html");
});
app.get("/api/reminders", async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "工作表1!A2:K"
  });
  const rows = result.data.values || [];
  const data = rows.map(row => ({
    id: row[0], name: row[1], mainCategory: row[2], subCategory: row[3],
    time: row[4], message: row[5], repeatType: row[6],
    repeatParam: row[7], expireDate: row[8], createdBy: row[9], lastSent: row[10]
  }));
  res.json(data);
});
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
        reminder.repeatType, reminder.repeatParam,
        reminder.expireDate, reminder.createdBy, reminder.lastSent
      ]]}
    });
    res.send("✅ 提醒已寫入 Google Sheets！");
  } catch (err) {
    res.status(500).send("❌ 寫入失敗：" + err.message);
  }
});
app.post("/webhook", (req, res) => res.sendStatus(200));
app.listen(PORT, () => console.log("Server running."));
