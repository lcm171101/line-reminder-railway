
# 📌 LINE Reminder Bot（Google Sheets 整合版）

本專案為一套整合 LINE Bot + Google Sheets 的提醒系統，具備表單建立提醒、提醒清單管理、自動與即時推播等功能。

---

## ✅ 功能總覽

### 🔔 提醒建立與推播
- 使用 `/form` 頁面建立提醒
- 成功建立後立即推播至指定 LINE 群組
- 每日早上 08:00～08:10（台灣時間）自動檢查 Google Sheet 並推播提醒（僅限平日）

### 🗂 提醒清單 `/reminders`
- 可查詢提醒清單
- 支援關鍵字搜尋
- 支援 CSV 匯出（完整欄位）
- 支援單筆刪除

### 📤 推播格式（格式 A）
```
📌 提醒人：張三
📂 分類：T0 / 產品 / 進度
🗓 提醒日期：2025-05-20
📨 內容：請記得提交設計報告
```

---

## 🔧 安裝與使用方式

### 1. 安裝依賴
```bash
npm install
```

### 2. 建立 Google Sheets 並設定欄位（含試算表 ID）
- 欄位順序如下：  
  `id, name, mainCategory, subCategory, subSubCategory, time, message, repeatType, repeatParam, expireDate, createdBy, lastSent`
- 使用 [google-spreadsheet](https://www.npmjs.com/package/google-spreadsheet) 套件
- 建立 service account 金鑰並命名為 `inxtip-xxxxxx.json`

### 3. 設定 server.js 參數
- Google Sheet ID
- LINE Channel Access Token
- LINE 推播目標群組 ID

### 4. 啟動伺服器
```bash
node server.js
```

### 5. 定時推播設定建議
- 可搭配 [UptimeRobot](https://uptimerobot.com) 每日觸發 `/push`
- 系統會判斷是否為台灣時間早上 08:00～08:10 再執行

---

## 📁 路由一覽

| 路徑             | 功能                 |
|------------------|----------------------|
| `/form`          | 建立提醒表單         |
| `/reminders`     | 查看提醒清單         |
| `/api/reminders` | 取得所有提醒資料 JSON |
| `/api/reminders/:id` | 刪除指定提醒        |
| `/push`          | 每日自動推播觸發路由  |

---

## 👨‍💻 作者
By [inxtip](https://github.com/lcm171101) ・整合 LINE Bot + Google Sheets 提醒系統。
