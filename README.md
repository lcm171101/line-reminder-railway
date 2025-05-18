
# 📅 LINE Reminder Bot

一個支援 LINE 群組推播與 Google Sheets 整合的提醒系統，支援建立提醒、每日推播、到期控制與網頁管理介面。

---

## ✅ 專案功能特色

- ✍️ 使用網頁表單 `/form` 建立提醒
- 🗂 網頁清單 `/reminders` 管理提醒資料（搜尋 / 刪除 / 匯出 CSV）
- 📤 成功建立提醒後立即 LINE 群組推播
- 🕗 每日早上 8 點自動推播今日提醒（僅平日）
- ⛔ 提醒僅於「提醒日期前 2 天起」～「停止推播日期」間發送
- ✅ 資料儲存在 Google Sheets 中（支援多人共用）
- 📄 美化版 UI，支援行動裝置顯示

---

## 🔧 安裝與部署（Render / Railway）

1. **上傳專案檔案**

   包含：
   - `server.js`
   - `form.html`
   - `reminders.html`
   - `package.json`

2. **安裝依賴套件**
   ```bash
   npm install
   ```

3. **新增 Google Sheets 金鑰檔（service account JSON）**
   - 命名為 `inxtip-xxxxxx.json`
   - 記得在 `server.js` 中 require 它

4. **啟動伺服器**
   ```bash
   node server.js
   ```

---

## 🔐 環境與設定

- LINE Channel Access Token：寫在 `server.js` 中
- Google Sheets ID：寫在 `server.js` 中 `new GoogleSpreadsheet(...)`

### ✅ 推播群組 ID

- 已設定為 `C9303cfa645cd5bc8b650c8a442010ccd`

---

## 🗂 資料表結構（Google Sheets）

| 欄位名稱         | 說明                     |
|------------------|--------------------------|
| id               | 唯一識別碼（UUID）        |
| name             | 被提醒人姓名              |
| mainCategory     | 主分類（如 T0、Fab5）     |
| subCategory      | 次分類（如 產品、DRC）    |
| subSubCategory   | 次次分類（自由輸入）      |
| time             | 提醒日期（YYYY-MM-DD）    |
| message          | 提醒內容                 |
| repeatType       | 重複週期（daily、weekly） |
| repeatParam      | 重複細節（如每週一）       |
| expireDate       | 停止推播日期              |
| createdBy        | 建立者名稱                |
| lastSent         | 最後推播日期（系統用）    |

---

## 📬 推播邏輯

- ✅ 成功建立提醒後，立即推播內容至 LINE 群組
- ✅ 每日早上 8 點檢查 Google Sheet
  - 若 `提醒日期 = 今天` 且 `到期日 ≥ 今天` 且為平日，則推播
  - 系統支援到期前兩天才開始推播

---

## 📎 授權

本專案由 [你的團隊/單位名稱] 製作，提供內部使用。如需協助部署，請聯繫開發人員。
