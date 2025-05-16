
# LINE Reminder Bot for Render

## 🧩 功能
- 表單輸入 LINE User ID 與提醒時間
- 自動發送 LINE 訊息提醒
- 每分鐘可由外部服務觸發 `/run-reminder`

## 🚀 Render 部署流程
1. 上傳此專案至 GitHub
2. 前往 https://render.com 建立 Web Service
3. 指定 GitHub 倉庫來源，Branch 選 main
4. 設定環境變數：LINE_TOKEN = 你的 LINE Bot Token
5. 等待部署完成

## 🔗 預設網址路由
- `/form`：提醒設定頁面
- `/run-reminder`：觸發提醒邏輯（可配合 cron-job.org）

## ⏱ 推薦自動排程服務
- [https://cron-job.org](https://cron-job.org)：每分鐘觸發 /run-reminder
