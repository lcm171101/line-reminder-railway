// LINE Reminder Bot v13 - 使用 Firebase Admin SDK (firebase-key.json)
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const reminderCollection = db.collection("reminders");
const reminders = [];

const app = express();
const PORT = process.env.PORT || 3000;
const LINE_TOKEN = process.env.LINE_TOKEN;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Load from Firestore
async function loadReminders() {
  const snapshot = await reminderCollection.get();
  snapshot.forEach(doc => {
    reminders.push({ id: doc.id, ...doc.data() });
  });
  console.log("Reminders loaded from Firebase");
}

// Save to Firestore
function saveReminder(reminder) {
  return reminderCollection.add(reminder);
}
function updateReminder(id, updateData) {
  return reminderCollection.doc(id).update(updateData);
}
function deleteReminder(id) {
  return reminderCollection.doc(id).delete();
}

// Webhook
app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];
  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text;
      const replyToken = event.replyToken;
      const parsed = parseReminderCommand(text);
      if (parsed) {
        const reminder = {
          id: uuidv4(),
          createdBy: event.source.userId,
          name: parsed.name,
          time: parsed.time,
          message: parsed.message,
          repeatType: parsed.repeatType,
          repeatParam: parsed.repeatParam,
          expireDate: "",
          lastSent: ""
        };
        reminders.push(reminder);
        await saveReminder(reminder);
        await replyMessage(replyToken, `✅ 已設定提醒：${parsed.name} ${parsed.time} ${parsed.message}（${parsed.repeatType}）`);
      } else {
        await replyMessage(replyToken, "⚠️ 指令格式錯誤，請使用：提醒 [姓名] [時間] [內容] [週期]");
      }
    } else if (event.type === "join" && event.source.type === "group") {
      const groupId = event.source.groupId;
      await pushMessage(groupId, "✅ 我已成功加入群組！請輸入提醒指令來建立提醒。");
    }
  }
  res.sendStatus(200);
});

// Utilities
function replyMessage(token, text) {
  return axios.post("https://api.line.me/v2/bot/message/reply", {
    replyToken: token,
    messages: [{ type: "text", text }]
  }, {
    headers: {
      Authorization: `Bearer ${LINE_TOKEN}`,
      "Content-Type": "application/json"
    }
  });
}
function pushMessage(to, text) {
  return axios.post("https://api.line.me/v2/bot/message/push", {
    to,
    messages: [{ type: "text", text }]
  }, {
    headers: {
      Authorization: `Bearer ${LINE_TOKEN}`,
      "Content-Type": "application/json"
    }
  });
}
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
  return { name, time, message, ...repeatMap[cycle] };
}

loadReminders().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ LINE Reminder Bot v13 running on port ${PORT}`);
  });
});
