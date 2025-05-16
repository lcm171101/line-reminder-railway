
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

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
  res.send("LINE Reminder Bot v4 - 編輯與刪除支援");
});

app.get("/form", (req, res) => {
  res.sendFile(__dirname + "/form.html");
});

app.get("/reminders", (req, res) => {
  let html = "<h2>目前提醒事項</h2><table border='1' cellspacing='0' cellpadding='5'><tr><th>User ID</th><th>時間</th><th>內容</th><th>重複</th><th>到期日</th><th>操作</th></tr>";
  reminders.forEach(r => {
    html += `<tr>
      <form action="/edit-reminder" method="post">
        <input type="hidden" name="id" value="${r.id}">
        <td><input type="text" name="userId" value="${r.userId}" required></td>
        <td><input type="text" name="time" value="${r.time}" required></td>
        <td><input type="text" name="message" value="${r.message}" required></td>
        <td>
          <select name="repeat">
            <option value="true" ${r.repeat ? "selected" : ""}>是</option>
            <option value="false" ${!r.repeat ? "selected" : ""}>否</option>
          </select>
        </td>
        <td><input type="date" name="expireDate" value="${r.expireDate || ""}"></td>
        <td>
          <button type="submit">更新</button>
          <form action="/delete-reminder" method="post" style="display:inline;">
            <input type="hidden" name="id" value="${r.id}">
            <button type="submit">刪除</button>
          </form>
        </td>
      </form>
    </tr>`;
  });
  html += "</table><br><a href='/form'>新增提醒</a>";
  res.send(html);
});

app.post("/set-reminder", (req, res) => {
  const { userId, time, message, repeat, expireDate } = req.body;
  reminders.push({ id: uuidv4(), userId, time, message, repeat: repeat === "true", expireDate, lastSent: "" });
  res.redirect("/reminders");
});

app.post("/delete-reminder", (req, res) => {
  const { id } = req.body;
  const index = reminders.findIndex(r => r.id === id);
  if (index !== -1) reminders.splice(index, 1);
  res.redirect("/reminders");
});

app.post("/edit-reminder", (req, res) => {
  const { id, userId, time, message, repeat, expireDate } = req.body;
  const r = reminders.find(r => r.id === id);
  if (r) {
    r.userId = userId;
    r.time = time;
    r.message = message;
    r.repeat = repeat === "true";
    r.expireDate = expireDate;
  }
  res.redirect("/reminders");
});

app.get("/run-reminder", (req, res) => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentDate = now.toDateString();
  const today = new Date().toISOString().slice(0, 10);

  reminders.forEach(reminder => {
    if (
      reminder.time === currentTime &&
      (!reminder.lastSent || reminder.lastSent !== currentDate) &&
      (!reminder.expireDate || reminder.expireDate >= today)
    ) {
      sendLineMessage(reminder.userId, `提醒您：${reminder.message}`);
      reminder.lastSent = currentDate;
    }
  });

  res.send("Reminders checked.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
