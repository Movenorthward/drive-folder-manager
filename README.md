# Drive Folder Manager for Education

> Google Drive 教育行政資料夾管理工具｜Google Apps Script + Drive API v2 + Google Sheets

**目前版本：v3.7.0**

Drive Folder Manager for Education 是一套為教育行政、學校專案與跨校資料蒐集情境設計的 Google Drive 資料夾管理工具。它可以協助使用者快速建立專案資料夾、批次建立學校或單位資料夾、套用子資料夾範本、批次設定共用權限，並透過專案管理介面追蹤資料夾狀態與操作紀錄。

## 線上入口

- 專案介紹網站（GitHub Pages）：部署後網址為 `https://movenorthward.github.io/drive-folder-manager/'
- Apps Script Web App：<https://script.google.com/a/macros/ckjh.kl.edu.tw/s/AKfycbyYrezhiy2nBHDj0fUDKcuoA1IqhYmKwdrqL1SyiRYlZsOcLEG-GFAdHV8dQ4pYD-oWCA/exec>

> GitHub Pages 只用來放專案介紹與開源文件。真正可操作 Google Drive 的應用程式仍需部署在 Google Apps Script，因為它需要 Google 帳號授權與 Drive API 權限。

## 主要功能

- 專案與資料夾整合管理
- 建立新專案時自動建立「專案名稱」資料夾
- 可改用既有 Google Drive 資料夾
- 單筆、批次貼上、CSV 與手動建立模式
- 自動建立子資料夾範本
- 批次設定 Viewer / Editor 權限
- 支援同一資料夾多位使用者權限
- 建立前智慧檢查
- 失敗項目一鍵重試
- 專案儀表板與最近操作紀錄
- 單一／批次移到垃圾桶與還原
- 同步 Google Drive 狀態
- 專案封存、解除封存、複製、編輯與刪除專案紀錄
- Google Sheets 作為專案、資料夾、權限與操作紀錄資料庫

## 專案架構

```text
drive-folder-manager-education/
├─ apps-script/
│  ├─ Code.gs
│  ├─ Index.html
│  └─ appsscript.json
├─ docs/
│  └─ index.html
├─ README.md
├─ CHANGELOG.md
├─ CONTRIBUTING.md
├─ SECURITY.md
├─ LICENSE
└─ .gitignore
```

## 技術架構

- Google Apps Script Web App
- Google Drive Advanced Service **v2**
- Google Sheets
- HTML / CSS / JavaScript
- GitHub Pages（專案介紹網站）

## 快速部署

### 1. 建立 Google Apps Script 專案

建立一個新的 Google Apps Script 專案，並將 `apps-script/` 內的三個檔案完整放入：

- `Code.gs`
- `Index.html`
- `appsscript.json`

### 2. 啟用 Drive API v2

在 Apps Script 左側「服務」新增 **Drive API**，版本請使用 **v2**。

### 3. 授權

在 Apps Script 編輯器執行：

```text
authorizeDriveAccess
```

依畫面完成 Google 帳號授權。

### 4. 部署 Web App

依序：

```text
部署 → 新增部署作業 → 網頁應用程式
```

部署完成後會取得 `/exec` 網址。

### 5. 初始化資料庫

首次使用時，系統會建立 Google Sheets 資料庫，包含 Projects、Folders、Permissions、Templates、PermissionTemplates、Logs、Settings 等工作表。

## GitHub Pages 部署

本專案的 GitHub Pages 使用 `docs/` 資料夾。

1. 建立公開 Repository：`drive-folder-manager-education`
2. 上傳本專案所有檔案
3. 前往 `Settings → Pages`
4. `Source` 選擇 `Deploy from a branch`
5. Branch 選 `main`
6. Folder 選 `/docs`
7. 儲存後等待 GitHub 發布

發布網址：

```text
https://ckjhkeelung.github.io/drive-folder-manager-education/
```

## 開源安裝注意事項

本專案不內含任何 Google OAuth Client Secret、API Key 或私人憑證。使用者必須使用自己的 Google Apps Script 專案與 Google 帳號授權。

若部署於 Google Workspace 組織，實際可用範圍會受到該組織管理員的 Apps Script、Drive API、Shared Drive 與外部共用政策限制。

## 安全原則

- 不要把 API Key、OAuth Secret、Service Account JSON 或 Access Token commit 到 GitHub。
- 建議保留 Google Drive 的垃圾桶機制，不提供一鍵永久刪除。
- 「刪除專案」只刪除 App 的管理紀錄，不會自動刪除 Google Drive 實體資料夾。
- 使用者必須自行確認對目標 Drive 資料夾具有建立、共用、移動到垃圾桶或還原等必要權限。

## 版本

目前開源版本：**v3.7.0**

詳細變更請參閱 [CHANGELOG.md](CHANGELOG.md)。

## 貢獻方式

歡迎 Fork、提出 Issue 或 Pull Request。若要新增功能，建議先描述使用情境、預期操作流程與可能影響的 Google Drive 權限範圍。

## 作者

**詹夫子 @MoveNorthward**

Email：`pe-fen@ckjh.kl.edu.tw`

GitHub：`CKJHKeelung`

本專案源自教育行政現場的實際需求，希望讓學校與教育行政人員能以較低的技術門檻管理大量 Google Drive 專案資料夾與權限。

## License

本專案採用 [MIT License](LICENSE)。你可以使用、修改、散布與再發布本專案，但請保留原始授權聲明。

## 免責聲明

本工具為開源輔助工具。使用者應自行確認 Google Drive 資料、共用權限、個資與組織資訊安全政策。作者不對因誤操作、權限設定、檔案刪除、Google API 政策變更或第三方服務異動造成的資料損失負責。
