# 📁 Drive Folder Manager for Education
這是一套專為學校行政人員、教師、公務機關、教育處與跨校專案管理情境設計的「Google Drive 專案與資料夾管理工具」。

系統以 Google Apps Script、Google Drive API v2 與 Google Sheets 建置，可協助使用者快速建立專案資料夾、批次建立學校或單位資料夾、自動套用子資料夾範本、批次設定共用權限，並透過專案管理介面追蹤資料夾狀態與操作紀錄。

無論您是資訊組長、教務主任、行政教師、教育處承辦人，或是不熟悉程式操作的一般使用者，都能透過簡單介面快速完成大量 Google Drive 資料夾建立與權限設定，減少重複性的人工操作。

---

## 🚀 立即體驗

您不需要另外安裝桌面軟體。

可直接透過目前部署的 Google Apps Script Web App 體驗：

👉 **立即體驗版本：**  
https://script.google.com/a/macros/ckjh.kl.edu.tw/s/AKfycbyYrezhiy2nBHDj0fUDKcuoA1IqhYmKwdrqL1SyiRYlZsOcLEG-GFAdHV8dQ4pYD-oWCA/exec

👉 **GitHub 原始碼：**  
https://github.com/Movenorthward/drive-folder-manager

> 本專案的 GitHub 主要用來保存原始碼、版本紀錄、安裝說明與開源授權。  
> 實際操作 Google Drive 的功能由 Google Apps Script Web App 提供。

---

## 【如何運作？只要 3 個步驟】

1. 建立或選擇一個專案，指定專案使用的新資料夾或既有 Google Drive 資料夾。
2. 輸入要建立的資料夾名稱、子資料夾範本與共用權限。
3. 執行建立前智慧檢查後，一鍵批次建立資料夾並套用權限。

系統會協助處理：

- 專案建立與管理
- 專案母資料夾建立
- 使用既有 Google Drive 資料夾
- 單筆資料夾建立
- 批次資料夾建立
- CSV 匯入
- 子資料夾範本
- Viewer / Editor 權限設定
- 同一資料夾多位使用者權限
- 建立前智慧檢查
- 失敗項目重試
- 專案儀表板
- Google Drive 狀態同步
- 資料夾移到垃圾桶與還原
- 操作紀錄與管理資料庫

---

## 🔐 核心特色：使用自己的 Google 帳號與 Google Drive

本系統不會將使用者的 Google Drive 資料集中儲存在開發者自建伺服器。

系統透過 Google Apps Script 執行，並依照 Google 帳號與 Google Drive 權限運作。

### Google Drive 存取方式

系統使用 Google Drive Advanced Service v2 進行：

- 建立資料夾
- 查詢資料夾
- 套用共用權限
- 同步資料夾狀態
- 移到垃圾桶
- 還原資料夾

實際能否操作某個資料夾，仍取決於使用者本身是否具有對應的 Google Drive 權限。

### Google Sheets 管理資料

系統使用 Google Sheets 作為管理資料庫，用於保存：

- Projects
- Folders
- Permissions
- Templates
- PermissionTemplates
- Logs
- Settings

這些資料主要用於管理專案、追蹤資料夾與記錄操作，不會取代 Google Drive 本身的實體資料。

---

## ✨ 系統亮點功能

### 1. 專案與資料夾整合管理

將原本分散的「專案管理」與「資料夾管理」整合在同一個操作區域。

使用者可以直接查看：

- 專案名稱
- 專案狀態
- 專案母資料夾
- 已建立資料夾數量
- 最近操作紀錄
- Google Drive 狀態
- 資料夾管理功能

減少在不同區塊之間切換的複雜操作。

---

### 2. 建立新專案時自動建立專案資料夾

若選擇建立新的專案資料夾，只需輸入：

- 專案名稱
- 上層母資料夾 ID 或網址

系統會自動建立：

```text
上層母資料夾
└── 專案名稱
    ├── 學校或單位 A
    ├── 學校或單位 B
    └── 學校或單位 C
```

建立完成後，系統會自動將新建立的專案資料夾 ID 帶入「建立位置與規則」。

---

### 3. 支援使用既有 Google Drive 資料夾

若專案已經有既有資料夾，可選擇：

> 使用原本／既有的資料夾

此模式不會另外建立新的專案資料夾。

使用者只需自行貼上：

- Google Drive 資料夾網址
- 或 Folder ID

即可開始後續批次建立。

---

### 4. 多種資料夾建立模式

支援：

- 單筆建立
- 批次貼上
- CSV 匯入
- 手動輸入

適合：

- 全市學校資料蒐集
- 校內各處室資料夾
- 研習成果繳交
- 計畫申請資料
- 跨校專案
- 大量名冊式資料夾建立

---

### 5. 子資料夾範本

可為每個主要資料夾自動建立固定結構。

例如：

```text
成功國中
├── 01_計畫
├── 02_成果
├── 03_照片
└── 04_其他附件
```

可減少每個學校或單位都要重複建立相同資料夾的工作。

---

### 6. 批次設定 Google Drive 權限

支援：

- Viewer
- Editor
- 同一權限套用全部資料夾
- 每個資料夾使用不同帳號
- 同一資料夾設定多位使用者

適合教育處、學校與跨校專案大量設定共用權限。

---

### 7. 建立前智慧檢查

在真正建立資料夾前，系統會先檢查：

- 母資料夾是否可存取
- 資料夾名稱是否空白
- 輸入資料是否重複
- 母資料夾中是否已有同名資料夾
- Email 格式是否正確
- 是否有重複權限帳號
- 預計建立的資料夾與權限數量

若有阻擋性錯誤，系統會先停止建立，降低大量建立後才發現錯誤的風險。

---

### 8. 失敗項目重試

當批次建立過程中有部分項目失敗時，可使用：

> 只重試失敗項目

避免全部重新執行。

系統會盡量跳過已成功建立的項目，降低重複建立資料夾的風險。

---

### 9. Google Drive 狀態同步

系統可重新確認管理資料庫中的資料夾是否仍存在於 Google Drive。

可辨識：

- 正常存在
- 已移到垃圾桶
- 不存在
- 權限不足
- 發生錯誤

方便管理者確認大量資料夾的目前狀態。

---

### 10. 垃圾桶與還原

系統支援：

- 單一資料夾移到垃圾桶
- 批次移到垃圾桶
- 單一還原
- 批次還原

本專案不提供「一鍵永久刪除」功能，以降低誤刪重要行政資料的風險。

另外：

> 「刪除專案」只刪除系統中的專案管理紀錄，不會自動刪除 Google Drive 實體資料夾。

若需要刪除 Google Drive 實體專案資料夾，建議由使用者自行於 Google Drive 手動處理。

---

### 11. 專案儀表板與操作紀錄

每個專案可查看：

- 已建立資料夾數
- 成功／失敗狀態
- 最近操作紀錄
- Google Drive 同步狀態
- 專案目前狀態

適合追蹤跨校資料蒐集、成果繳交與行政專案執行情形。

---

### 12. My Drive 與 Shared Drives 情境

本系統以 Google Drive API 為核心，可依使用者帳號與組織權限操作：

- 我的雲端硬碟
- 共用雲端硬碟
- Google Workspace 組織內共用資料夾

實際可用範圍仍會受到：

- Google Workspace 管理員政策
- 共用雲端硬碟角色
- 外部共用限制
- Drive API 權限

影響。

---

## 🛠️ 給資訊組長與開發者的話（Fork & Deploy）

本系統採用 Google Apps Script 架構，不需要自行架設傳統 Web Server。

主要使用技術：

- Google Apps Script
- Google Drive Advanced Service v2
- Google Sheets
- HTML5
- CSS
- JavaScript
- Google Apps Script HTML Service
- Google OAuth 授權機制

如果您希望將系統部署在自己的學校、單位或個人 Google Workspace 環境，可以 Fork 本專案後自行建立 Apps Script 專案。

---

## Google Apps Script 部署步驟

1. Fork 本 Repository，或下載原始碼。
2. 前往 Google Apps Script 建立新專案。
3. 將 `apps-script/Code.gs` 完整貼入 `Code.gs`。
4. 建立 `Index.html`，將 `apps-script/Index.html` 完整貼入。
5. 開啟 `appsscript.json`，將 `apps-script/appsscript.json` 完整貼入。
6. 在 Apps Script 左側「服務」新增 **Drive API**。
7. Drive API 版本請使用 **v2**。
8. 儲存專案。
9. 執行：

```text
authorizeDriveAccess
```

10. 完成 Google 帳號授權。
11. 進入：

```text
部署 → 新增部署作業 → 網頁應用程式
```

12. 依自己的組織需求設定執行身分與存取權限。
13. 完成部署後，即可取得 `/exec` 網址。

---

## 📁 專案結構

```text
drive-folder-manager/
├── apps-script/
│   ├── Code.gs
│   ├── Index.html
│   └── appsscript.json
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── .gitignore
```

本專案將 Google Apps Script 主要程式集中於 `apps-script/` 資料夾中，方便其他使用者 Fork、下載、修改與重新部署。

---

## 🔑 Google 帳號與授權方式

本系統不需要使用者輸入 Google 密碼。

Google Drive 存取權限由 Google 官方 OAuth 授權流程處理。

首次執行時，使用者可能需要授權：

- Google Drive
- Google Sheets
- 使用者 Email
- Apps Script 相關權限

### 安全提醒

請勿將以下資料上傳到公開 GitHub：

- OAuth Client Secret
- API Key
- Access Token
- Refresh Token
- Service Account JSON
- 私人憑證
- 含學生個資的測試資料
- 私人 Google Drive 連結

若使用 `.clasp.json`，也建議不要直接提交包含私人 Script ID 的設定檔。

---

## ⚠️ 使用注意事項

本系統會實際操作 Google Drive。

執行前請務必確認：

- 母資料夾是否正確
- 是否使用正確 Google 帳號
- 是否具有建立資料夾權限
- 是否具有設定共用權限
- 是否有同名資料夾
- Email 是否輸入正確
- Viewer / Editor 是否設定正確
- 是否誤選共用雲端硬碟
- 是否可能影響其他使用者既有資料

大量建立前，建議先使用少量測試資料確認流程。

---

## 💡 適合使用的情境

- 教育處建立全市學校資料繳交資料夾
- 教務處建立各領域或教師資料夾
- 數位學習計畫成果蒐集
- 國際教育計畫資料蒐集
- 校務評鑑資料整理
- 跨校專案管理
- 教師研習成果收件
- 計畫申請附件管理
- 學校行政資料分層管理
- 大量 Google Drive 權限設定
- 共用雲端硬碟專案資料管理
- 教育行政數位轉型實作

---

## 👤 關於作者與出處

作者：**詹夫子 @MoveNorthward**

GitHub：  
https://github.com/Movenorthward

開發備註：

作者本身為非資訊專長教師，本系統從教育行政現場的實際需求出發，透過 AI 工具輔助開發，希望減少教師、行政人員與教育處承辦人在 Google Drive 中反覆建立資料夾、複製名稱與設定共用權限的時間。

若您有程式碼優化建議、功能許願、錯誤回報，或希望應用於學校與教育機關，非常歡迎各界先進、資訊教師與行政夥伴交流指教。

聯繫方式：  
pe-fen@ckjh.kl.edu.tw

---


## 📄 版權聲明

© 2026 Drive Folder Manager for Education.

本專案採開源方式發布，歡迎自由使用、修改與分享，致力於讓教育行政中的 Google Drive 專案管理更加簡單、快速與實用。

本專案建議採用 **MIT License**。

詳細授權內容請參閱：

[LICENSE](LICENSE)

---

## 📌 免責聲明

本系統為教育行政與 Google Drive 管理輔助工具，不保證所有 Google Drive 操作、權限設定、資料夾建立與同步狀態皆能百分之百成功。

使用者應自行確認：

- Google Drive 資料是否正確
- 共用權限是否符合需求
- 是否涉及學生、教師或行政個資
- 是否符合學校與機關資訊安全政策
- Google Workspace 組織管理政策
- Google API 使用限制
- Shared Drives 權限與角色

開發者不對因誤操作、權限設定、資料夾刪除、Google API 政策調整、服務中斷、組織限制或其他使用結果造成的資料損失負責。

使用本系統時，亦應遵守 Google 的服務條款、隱私政策與 Google Workspace 使用規範。
