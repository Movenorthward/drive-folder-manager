# Security Policy

## 回報安全問題

請不要在公開 Issue 張貼：

- API Key
- OAuth Secret
- Access Token
- Service Account JSON
- Google Drive 私人連結
- 學生、教師或行政人員個資

可透過作者聯絡信箱回報：`pe-fen@ckjh.kl.edu.tw`

## 安全注意事項

本專案使用 Google Apps Script 與 Google Drive API，實際權限以部署者與使用者的 Google 帳號及 Workspace 組織政策為準。

使用者在正式環境部署前，應先使用測試資料夾驗證：

- 建立資料夾
- 批次權限
- Shared Drive 權限
- 垃圾桶與還原
- 多帳號登入情境
