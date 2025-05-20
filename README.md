# 📌 LINE Reminder Bot（Google Sheets 整合 + 自動推播版）

這是一套以 Node.js 建構、結合 LINE Bot + Google Sheets 的提醒系統，可透過網頁表單快速建立提醒，並依據提醒日期進行自動推播。  
適合團隊/單位內部工作事項管理。

---

## ✅ 系統功能總覽

### 🔔 建立與推播提醒
- 使用 `/form` 頁面建立提醒資料
- 成功後 **立即推播至 LINE 群組**
- 支援每日兩個自動推播時段（僅限平日）：

| 台灣時間         | 推播條件                             | 推播內容         |
|------------------|--------------------------------------|------------------|
| ⏰ 08:00～08:10   | 平日 & 提醒日期 = 今日 & 未過到期日  | 今日提醒         |
| ⏰ 16:50～17:00   | 平日 & 提醒日期 = 明日 & 未過到期日  | 明日提醒預告     |

---

### 🗂 `/reminders` 提醒清單管理
- 列出所有提醒資料（含次分類）
- 支援即時搜尋與刪除
- 支援一鍵匯出 CSV（含完整欄位）

---

### 📤 LINE 推播格式
```
📌 提醒人：王小明
📂 分類：T2 / DRC / 報告送出
🗓 提醒日期：2025-05-21
📨 內容：記得上傳 DRC 結果
```

---

## ⚙️ 安裝與設定

### 1. 安裝必要套件
```bash
npm install
```

### 2. 建立 Google Sheets
- 欄位順序如下（與程式同步）：
  ```
  id, name, mainCategory, subCategory, subSubCategory, time, message, repeatType, repeatParam, expireDate, createdBy, lastSent
  ```
- 分享給 Google service account
- 金鑰檔命名為：`inxtip-xxxxxx.json`

### 3. 設定 `server.js`
```js
const doc = new GoogleSpreadsheet("你的 Google Sheet ID");
const creds = require("./inxtip-xxxxxx.json");
const LINE_CHANNEL_ACCESS_TOKEN = "你的 LINE Token";
const TARGET_GROUP_ID = "你的群組 ID";
```

### 4. 啟動伺服器
```bash
node server.js
```

---

## ⏱ 自動推播定時建議

使用 [UptimeRobot](https://uptimerobot.com) 設定兩筆定時觸發：
- 每日 08:01 呼叫 `/push` → 今日提醒
- 每日 16:51 呼叫 `/push` → 明日提醒

URL 範例：`https://your-domain.com/push`

---

## 📁 主要路由

| 路徑               | 說明                         |
|--------------------|------------------------------|
| `/form`            | 建立提醒的表單頁面           |
| `/reminders`       | 查看與管理提醒清單           |
| `/api/reminders`   | 提供所有提醒資料 JSON        |
| `/api/reminders/:id` | 刪除指定提醒資料            |
| `/push`            | 自動推播執行點（供定時觸發） |

---

## 🧩 依賴套件
- express
- body-parser
- uuid
- google-spreadsheet
- axios
- node-cron（預留進階定時用途）

---

## 👨‍💻 作者
By [inxtip](https://github.com/lcm171101)  
打造 LINE Bot + Google Sheets 高效工作提醒整合解決方案。