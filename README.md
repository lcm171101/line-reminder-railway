
# LINE Reminder Bot for Railway

這是一個 LINE 定時提醒機器人，支援 LINE Bot 推播提醒訊息，可透過表單設定提醒內容。

## ✅ 功能特色

- 網頁表單設定提醒時間與內容
- 自動推送 LINE 訊息
- 可部署於 Railway，免費且不中斷
- 可搭配 cron-job.org 每分鐘定時呼叫

## 🚀 一鍵部署到 Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new)

1. 點上方按鈕進入 Railway 建立專案
2. 設定環境變數：`LINE_TOKEN`
3. 等待部署完成，開啟 `/form` 進行測試

## 🧪 測試

- 表單：`https://your-app.up.railway.app/form`
- 定時執行（手動）：`https://your-app.up.railway.app/run-reminder`

## 🔧 環境變數

| 名稱 | 說明 |
|------|------|
| `LINE_TOKEN` | 你的 LINE Bot 的 Channel Access Token |

## ⏱️ 建議排程方式

建議搭配 [cron-job.org](https://cron-job.org) 來定時觸發 `/run-reminder`。
