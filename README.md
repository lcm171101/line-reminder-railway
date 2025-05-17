
# LINE Reminder Bot v12（Firebase 同步版）

## 功能特色
- ✅ 支援 LINE webhook 自動建立提醒
- ✅ `/form` 建立提醒，含姓名與時間下拉選單
- ✅ 編輯 / 刪除提醒會自動同步至 Firebase Firestore
- ✅ 支援提醒週期（once/daily/weekly/monthly）

## 部署教學（Render）
1. 上傳本專案至 GitHub
2. 建立 Render Web Service，設環境變數：LINE_TOKEN
3. 指定啟動指令：`npm start`
4. 將 Webhook 設為：`https://your-app-url/webhook`

## Firebase 結構
集合：`reminders`
欄位：name / createdBy / time / message / repeatType / repeatParam / expireDate / lastSent
