
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

function getTodayInfo() {
  const now = new Date();
  return {
    dateStr: now.toISOString().slice(0, 10), // yyyy-mm-dd
    timeStr: now.toTimeString().slice(0, 5), // HH:MM
    dayOfWeek: now.getDay(), // 0 (Sun) - 6 (Sat)
    dayOfMonth: now.getDate() // 1 - 31
  };
}

app.get("/", (req, res) => {
  res.send("LINE Reminder Bot v5 - 週期支援（每日/每週/每月/單次）");
});

app.get("/form", (req, res) => {
  res.sendFile(__dirname + "/form.html");
});

app.get("/reminders", (req, res) => {
  let html = "<h2>目前提醒事項</h2><table border='1'><tr><th>姓名</th><th>設定者</th><th>時間</th><th>內容</th><th>週期</th><th>參數</th><th>到期日</th><th>操作</th></tr>";
  reminders.forEach(r => {
    html += `<tr>
      <form action="/edit-reminder" method="post">
        <input type="hidden" name="id" value="${r.id}">
        <td><input type='text' name='name' value='${r.name || ""}' required></td><td><input type='text' name='createdBy' value='${r.createdBy}' required></td>
        <td><input type="text" name="time" value="${r.time}" required></td>
        <td><input type="text" name="message" value="${r.message}" required></td>
        <td>
          <select name="repeatType">
            <option value="once" ${r.repeatType === "once" ? "selected" : ""}>單次</option>
            <option value="daily" ${r.repeatType === "daily" ? "selected" : ""}>每日</option>
            <option value="weekly" ${r.repeatType === "weekly" ? "selected" : ""}>每週</option>
            <option value="monthly" ${r.repeatType === "monthly" ? "selected" : ""}>每月</option>
          </select>
        </td>
        <td><input type="text" name="repeatParam" value="${r.repeatParam || ""}"></td>
        <td><input type="date" name="expireDate" value="${r.expireDate || ""}"></td>
        <td>
          <button type="submit">更新</button>
        </form>
        <form action="/delete-reminder" method="post" style="display:inline;">
          <input type="hidden" name="id" value="${r.id}">
          <button type="submit">刪除</button>
        </form>
        </td>
    </tr>`;
  });
  html += "</table><br><a href='/form'>新增提醒</a>";
  res.send(html);
});

app.post("/set-reminder", (req, res) => {
  const { createdBy, name, time, message, repeatType, repeatParam, expireDate } = req.body;
  reminders.push({ id: uuidv4(), createdBy, name, time, message, repeatType, repeatParam, expireDate, lastSent: "" });
  res.redirect("/reminders");
});

app.post("/edit-reminder", (req, res) => {
  const { id, createdBy, name, time, message, repeatType, repeatParam, expireDate } = req.body;
  const r = reminders.find(r => r.id === id);
  if (r) {
    r.createdBy = createdBy;
    r.name = name;
    r.time = time;
    r.message = message;
    r.repeatType = repeatType;
    r.repeatParam = repeatParam;
    r.expireDate = expireDate;
  }
  res.redirect("/reminders");
});

app.post("/delete-reminder", (req, res) => {
  const { id } = req.body;
  const idx = reminders.findIndex(r => r.id === id);
  if (idx !== -1) reminders.splice(idx, 1);
  res.redirect("/reminders");
});

app.get("/run-reminder", (req, res) => {
  const now = getTodayInfo();
  reminders.forEach(reminder => {
    const shouldRun =
      reminder.time === now.timeStr &&
      (!reminder.expireDate || reminder.expireDate >= now.dateStr) &&
      (
        (reminder.repeatType === "daily") ||
        (reminder.repeatType === "weekly" && parseInt(reminder.repeatParam) === now.dayOfWeek) ||
        (reminder.repeatType === "monthly" && parseInt(reminder.repeatParam) === now.dayOfMonth) ||
        (reminder.repeatType === "once" && reminder.lastSent === "")
      );

    if (shouldRun && reminder.lastSent !== now.dateStr) {
      sendLineMessage(reminder.createdBy, `提醒您（${reminder.name}）：${reminder.message}`);
      reminder.lastSent = now.dateStr;
    }
  });
  res.send("Checked reminders.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// LINE Webhook 接收訊息
app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];
  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text;
      const replyToken = event.replyToken;

      const parsed = parseReminderCommand(text);
      if (parsed) {
        reminders.push({
          id: uuidv4(),
          createdBy: event.source.userId,
          name: parsed.name,
          time: parsed.time,
          message: parsed.message,
          repeatType: parsed.repeatType,
          repeatParam: parsed.repeatParam,
          expireDate: parsed.expireDate || "",
          lastSent: ""
        });

        await replyMessage(replyToken, `✅ 已設定提醒：${parsed.name} ${parsed.time} ${parsed.message}（${parsed.repeatType}）`);
      } else {
        await replyMessage(replyToken, "⚠️ 指令格式錯誤，請使用：提醒 [姓名] [時間] [內容] [週期]");
      }
    }
  }
  res.sendStatus(200);
});

function replyMessage(replyToken, text) {
  return axios.post("https://api.line.me/v2/bot/message/reply", {
    replyToken,
    messages: [{ type: "text", text }]
  }, {
    headers: {
      'Authorization': `Bearer ${LINE_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

// 指令格式：提醒 張小明 09:00 喝水 每日
function parseReminderCommand(text) {
  const regex = /^提醒\s+(\S+)\s+(\d{1,2}:\d{2})\s+(\S+)\s+(每日|每週|每月)$/;
  const match = text.match(regex);
  if (!match) return null;

  const [_, name, time, message, cycle] = match;
  const now = new Date();
  const repeatMap = {
    "每日": { repeatType: "daily", repeatParam: "" },
    "每週": { repeatType: "weekly", repeatParam: now.getDay().toString() },
    "每月": { repeatType: "monthly", repeatParam: now.getDate().toString() }
  };

  return {
    name,
    time,
    message,
    ...repeatMap[cycle]
  };
}
