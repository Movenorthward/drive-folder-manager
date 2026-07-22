# Contributing

感謝你願意協助改進 Drive Folder Manager for Education。

## 建議流程

1. Fork 本 Repository。
2. 建立功能分支。
3. 修改並測試 Google Apps Script 程式。
4. 確認沒有提交任何 API Key、OAuth Secret、Access Token、Service Account JSON 或私人資料。
5. 提交 Pull Request，說明：
   - 使用情境
   - 修改內容
   - 測試方式
   - 是否影響 Google Drive / Shared Drive 權限

## 程式原則

- Drive Advanced Service 維持 v2，除非整個專案完成完整遷移與回歸測試。
- 高風險刪除操作應優先使用垃圾桶，不直接永久刪除。
- 前端與後端修改需保持現有專案資料結構相容。
- 新功能應盡量維持教育行政人員可以直接理解與操作。
