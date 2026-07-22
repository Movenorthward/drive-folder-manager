/**
 * ============================================================
 * Drive Folder Manager for Education
 * Version 3.7
 * Google Apps Script + Drive Advanced Service API v2
 * ============================================================
 */

const APP_NAME = 'Drive Folder Manager for Education';
const APP_VERSION = '3.7';
const DB_PROPERTY_KEY = 'DRIVE_FOLDER_MANAGER_DATABASE_ID';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAppInfo() {
  let email = '';
  let appUrl = '';
  try { email = Session.getActiveUser().getEmail() || ''; } catch (e) {}
  try { appUrl = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  return { appName: APP_NAME, version: APP_VERSION, email, appUrl };
}

function authorizeDriveAccess() {
  const result = Drive.Files.list({ maxResults: 1, q: 'trashed = false' });
  return { success: true, message: 'Drive API 授權成功', count: (result.items || []).length };
}

function extractGoogleDriveId_(input) {
  input = String(input || '').trim();
  if (!input) return '';
  if (/^[A-Za-z0-9_-]{10,}$/.test(input)) return input;
  const patterns = [
    /\/folders\/([A-Za-z0-9_-]+)/,
    /[?&]id=([A-Za-z0-9_-]+)/,
    /\/d\/([A-Za-z0-9_-]+)/
  ];
  for (let i = 0; i < patterns.length; i++) {
    const m = input.match(patterns[i]);
    if (m && m[1]) return m[1];
  }
  return input;
}

function escapeDriveQueryValue_(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function findFolderByName_(parentFolderId, folderName) {
  const parentId = extractGoogleDriveId_(parentFolderId);
  const safeName = escapeDriveQueryValue_(folderName);
  const query = "'" + parentId + "' in parents" +
    " and title = '" + safeName + "'" +
    " and mimeType = '" + FOLDER_MIME_TYPE + "'" +
    " and trashed = false";
  const result = Drive.Files.list({ q: query, maxResults: 100 });
  const items = result.items || [];
  return items.length ? items[0] : null;
}

function createDriveFolder_(folderName, parentFolderId) {
  const parentId = extractGoogleDriveId_(parentFolderId);
  if (!parentId) throw new Error('缺少母資料夾 ID。');
  const metadata = {
    title: folderName,
    mimeType: FOLDER_MIME_TYPE,
    parents: [{ id: parentId }]
  };
  return Drive.Files.insert(metadata, null, { supportsAllDrives: true });
}

function getOrCreateFolder_(parentFolderId, folderName, duplicatePolicy) {
  const existing = findFolderByName_(parentFolderId, folderName);
  if (existing && duplicatePolicy === 'skip') {
    return { folder: existing, created: false, skipped: true, message: '已存在同名資料夾，使用既有資料夾' };
  }
  const folder = createDriveFolder_(folderName, parentFolderId);
  return { folder, created: true, skipped: false, message: '建立成功' };
}

function createTemplateFolders_(parentFolderId, templateFolders) {
  const results = [];
  (templateFolders || []).forEach(nameRaw => {
    const name = String(nameRaw || '').trim();
    if (!name) return;
    try {
      const result = getOrCreateFolder_(parentFolderId, name, 'skip');
      results.push({ name, success: true, folderId: result.folder.id, created: result.created });
    } catch (e) {
      results.push({ name, success: false, message: e.message });
    }
  });
  return results;
}

function normalizeRole_(role) {
  role = String(role || '').toLowerCase().trim();
  return ['writer','editor','edit','編輯','編輯者'].includes(role) ? 'writer' : 'reader';
}

function addPermission_(fileId, email, role) {
  email = String(email || '').trim();
  if (!email) throw new Error('Email 不可空白');
  const permission = { type: 'user', role: normalizeRole_(role), value: email };
  return Drive.Permissions.insert(permission, fileId, {
    sendNotificationEmails: false,
    supportsAllDrives: true
  });
}

function applyPermissions_(folderId, permissions) {
  const results = [];
  (permissions || []).forEach(p => {
    const email = String(p.email || '').trim();
    if (!email) return;
    const role = normalizeRole_(p.role);
    try {
      const result = addPermission_(folderId, email, role);
      results.push({ email, role, success: true, permissionId: result.id || '' });
    } catch (e) {
      results.push({ email, role, success: false, message: e.message });
    }
  });
  return results;
}

function createFoldersBatch(payload) {
  if (!payload) throw new Error('未收到建立資料。');
  const parentFolderId = extractGoogleDriveId_(payload.parentFolderId);
  if (!parentFolderId) throw new Error('請提供母資料夾 ID 或網址。');
  const rows = payload.rows || [];
  if (!rows.length) throw new Error('沒有可建立的資料。');

  const duplicatePolicy = payload.duplicatePolicy === 'create' ? 'create' : 'skip';
  const templateFolders = payload.templateFolders || [];
  const projectId = String(payload.projectId || '');
  const results = [];
  let successCount = 0, skippedCount = 0, errorCount = 0;

  rows.forEach(row => {
    const folderName = String(row.name || '').trim();
    if (!folderName) return;
    try {
      const folderResult = getOrCreateFolder_(parentFolderId, folderName, duplicatePolicy);
      const folder = folderResult.folder;
      const folderId = folder.id;
      const folderUrl = 'https://drive.google.com/drive/folders/' + folderId;
      const childResults = createTemplateFolders_(folderId, templateFolders);
      const permissionResults = applyPermissions_(folderId, row.permissions || []);
      const failedPermissions = permissionResults.filter(x => !x.success);

      if (projectId) {
        try {
          saveFolderRecord_({
            projectId, folderName, folderId, folderUrl, parentFolderId, level: 0,
            status: folderResult.skipped ? 'skipped' : 'active',
            message: folderResult.message
          });
          permissionResults.forEach(permission => savePermissionRecord_({
            projectId, folderId, folderName, email: permission.email, role: permission.role,
            status: permission.success ? 'success' : 'error', message: permission.message || ''
          }));
          writeSystemLog_({
            action: folderResult.skipped ? 'REUSE_FOLDER' : 'CREATE_FOLDER',
            projectId, targetType: 'FOLDER', targetName: folderName, targetId: folderId,
            status: failedPermissions.length ? 'warning' : 'success', message: folderResult.message
          });
        } catch (dbErr) {
          console.error('資料庫寫入失敗：' + dbErr.message);
        }
      }

      folderResult.skipped ? skippedCount++ : successCount++;
      let message = folderResult.message;
      if (childResults.length) {
        const childErrors = childResults.filter(x => !x.success);
        message += '；子資料夾 ' + (childResults.length - childErrors.length) + '/' + childResults.length + ' 成功';
      }
      if (permissionResults.length) {
        message += '；權限 ' + (permissionResults.length - failedPermissions.length) + '/' + permissionResults.length + ' 成功';
      }
      results.push({
        name: folderName,
        status: folderResult.skipped ? 'skipped' : 'success',
        folderId, url: folderUrl, message
      });
    } catch (e) {
      errorCount++;
      results.push({ name: folderName, status: 'error', folderId: '', url: '', message: e.message });
      if (projectId) {
        try {
          writeSystemLog_({ action: 'CREATE_FOLDER', projectId, targetType: 'FOLDER', targetName: folderName, targetId: '', status: 'error', message: e.message });
        } catch (ignore) {}
      }
    }
  });

  return { total: rows.length, success: successCount, skipped: skippedCount, error: errorCount, results };
}


/* ===================== v3.4 建立前智慧檢查 ===================== */

function isValidEmail_(email) {
  email = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function listExistingChildFolders_(parentFolderId) {
  const parentId = extractGoogleDriveId_(parentFolderId);
  const names = {};
  let pageToken = null;
  do {
    const params = {
      q: "'" + parentId + "' in parents and mimeType = '" + FOLDER_MIME_TYPE + "' and trashed = false",
      maxResults: 1000
    };
    if (pageToken) params.pageToken = pageToken;
    const result = Drive.Files.list(params);
    (result.items || []).forEach(file => {
      const title = String(file.title || '');
      if (!names[title]) names[title] = [];
      names[title].push(file.id);
    });
    pageToken = result.nextPageToken || null;
  } while (pageToken);
  return names;
}

/**
 * 建立前完整檢查。
 * 不建立資料夾、不修改權限，只檢查輸入與 Drive 狀態。
 */
function preflightCheck(payload) {
  try {
    if (!payload) throw new Error('未收到檢查資料。');
    const parentFolderId = extractGoogleDriveId_(payload.parentFolderId);
    const rows = payload.rows || [];
    const templateFolders = (payload.templateFolders || []).map(x => String(x || '').trim()).filter(Boolean);
    const issues = [];

    if (!parentFolderId) {
      issues.push({ severity: 'error', type: 'parent', message: '缺少母資料夾 ID 或網址。' });
    } else {
      try {
        const parent = Drive.Files.get(parentFolderId, { supportsAllDrives: true });
        if (parent.mimeType !== FOLDER_MIME_TYPE) {
          issues.push({ severity: 'error', type: 'parent', message: '指定位置不是 Google Drive 資料夾。' });
        }
        if (parent.trashed) {
          issues.push({ severity: 'error', type: 'parent', message: '母資料夾目前位於垃圾桶。' });
        }
      } catch (e) {
        issues.push({ severity: 'error', type: 'parent', message: '無法存取母資料夾：' + e.message });
      }
    }

    if (!rows.length) {
      issues.push({ severity: 'error', type: 'rows', message: '沒有可建立的資料。' });
    }

    const nameCount = {};
    let permissionCount = 0;
    let invalidEmailCount = 0;
    let duplicateEmailCount = 0;

    rows.forEach((row, index) => {
      const name = String(row.name || '').trim();
      if (!name) {
        issues.push({ severity: 'error', type: 'name', row: index + 1, message: '第 ' + (index + 1) + ' 筆資料夾名稱為空白。' });
      } else {
        nameCount[name] = (nameCount[name] || 0) + 1;
      }

      const seenEmails = {};
      (row.permissions || []).forEach(p => {
        const email = String(p.email || '').trim().toLowerCase();
        if (!email) return;
        permissionCount++;
        if (!isValidEmail_(email)) {
          invalidEmailCount++;
          issues.push({ severity: 'error', type: 'email', row: index + 1, message: '「' + name + '」Email 格式不正確：' + email });
        }
        if (seenEmails[email]) {
          duplicateEmailCount++;
          issues.push({ severity: 'warning', type: 'duplicate_email', row: index + 1, message: '「' + name + '」重複設定 Email：' + email });
        }
        seenEmails[email] = true;
      });
    });

    const duplicateInputNames = Object.keys(nameCount).filter(name => nameCount[name] > 1);
    duplicateInputNames.forEach(name => {
      issues.push({ severity: 'warning', type: 'duplicate_name', message: '匯入資料中重複名稱「' + name + '」共 ' + nameCount[name] + ' 筆。' });
    });

    let existingFolderCount = 0;
    const existingFolderNames = [];
    if (parentFolderId && !issues.some(x => x.severity === 'error' && x.type === 'parent')) {
      try {
        const existingMap = listExistingChildFolders_(parentFolderId);
        Object.keys(nameCount).forEach(name => {
          if (existingMap[name] && existingMap[name].length) {
            existingFolderCount++;
            existingFolderNames.push(name);
          }
        });
        if (existingFolderNames.length) {
          issues.push({
            severity: 'warning',
            type: 'existing',
            message: '母資料夾內已有 ' + existingFolderNames.length + ' 個同名資料夾：' + existingFolderNames.slice(0, 10).join('、') + (existingFolderNames.length > 10 ? '…' : '')
          });
        }
      } catch (e) {
        issues.push({ severity: 'error', type: 'existing_check', message: '無法檢查同名資料夾：' + e.message });
      }
    }

    const errorCount = issues.filter(x => x.severity === 'error').length;
    const warningCount = issues.filter(x => x.severity === 'warning').length;
    return {
      success: true,
      canProceed: errorCount === 0,
      stats: {
        totalRows: rows.length,
        uniqueNames: Object.keys(nameCount).length,
        duplicateInputNameCount: duplicateInputNames.length,
        existingFolderCount,
        templateFolderCount: templateFolders.length,
        estimatedChildFolders: rows.length * templateFolders.length,
        permissionCount,
        invalidEmailCount,
        duplicateEmailCount,
        errorCount,
        warningCount
      },
      issues
    };
  } catch (e) {
    return { success: false, canProceed: false, message: e.message, stats: {}, issues: [] };
  }
}

/* ===================== v3.1 資料夾管理 ===================== */

function getProjectFolders(projectId) {
  try {
    projectId = String(projectId || '').trim();
    if (!projectId) return { success: true, folders: [] };
    const db = getDatabase_();
    const sheet = db.getSheetByName('Folders');
    if (!sheet || sheet.getLastRow() < 2) return { success: true, folders: [] };
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
    const latestByFolderId = {};
    values.forEach(row => {
      if (String(row[1]) !== projectId || !row[3]) return;
      latestByFolderId[String(row[3])] = {
        folderRecordId: row[0], projectId: row[1], folderName: row[2], folderId: row[3], folderUrl: row[4],
        parentFolderId: row[5], level: row[6], status: row[7] || 'active', message: row[8] || '',
        createdAt: row[9] instanceof Date ? row[9].toISOString() : row[9]
      };
    });
    return { success: true, folders: Object.values(latestByFolderId) };
  } catch (e) {
    return { success: false, message: e.message, folders: [] };
  }
}

function getDriveFolderStatus(folderId) {
  try {
    folderId = extractGoogleDriveId_(folderId);
    const file = Drive.Files.get(folderId, { supportsAllDrives: true });
    return {
      success: true,
      exists: true,
      folderId,
      name: file.title || '',
      trashed: !!file.trashed,
      status: file.trashed ? 'trashed' : 'active',
      url: 'https://drive.google.com/drive/folders/' + folderId
    };
  } catch (e) {
    const msg = String(e.message || e);
    const missing = /not found|file not found|404/i.test(msg);
    return { success: false, exists: !missing, folderId, status: missing ? 'missing' : 'error', message: msg };
  }
}

function trashFolder(folderId, projectId) {
  try {
    folderId = extractGoogleDriveId_(folderId);
    if (!folderId) throw new Error('缺少 Folder ID。');
    const before = Drive.Files.get(folderId, { supportsAllDrives: true });
    if (before.trashed) {
      updateFolderStatus_(folderId, 'trashed', '資料夾已在垃圾桶');
      return { success: true, folderId, name: before.title || '', status: 'trashed', message: '資料夾已在垃圾桶' };
    }
    const result = Drive.Files.trash(folderId, { supportsAllDrives: true });
    updateFolderStatus_(folderId, 'trashed', '已移到垃圾桶');
    writeSystemLog_({ action: 'TRASH_FOLDER', projectId: projectId || '', targetType: 'FOLDER', targetName: result.title || before.title || '', targetId: folderId, status: 'success', message: '已移到垃圾桶' });
    return { success: true, folderId, name: result.title || before.title || '', status: 'trashed', message: '已移到垃圾桶' };
  } catch (e) {
    return { success: false, folderId, status: 'error', message: e.message };
  }
}

function trashFoldersBatch(folderIds, projectId) {
  const ids = Array.from(new Set((folderIds || []).map(extractGoogleDriveId_).filter(Boolean)));
  const results = ids.map(id => trashFolder(id, projectId));
  return {
    success: true,
    total: results.length,
    successCount: results.filter(x => x.success).length,
    errorCount: results.filter(x => !x.success).length,
    results
  };
}

function restoreFolder(folderId, projectId) {
  try {
    folderId = extractGoogleDriveId_(folderId);
    if (!folderId) throw new Error('缺少 Folder ID。');
    const before = Drive.Files.get(folderId, { supportsAllDrives: true });
    let result = before;
    if (before.trashed) {
      result = Drive.Files.untrash(folderId, { supportsAllDrives: true });
    }
    updateFolderStatus_(folderId, 'active', '已還原');
    writeSystemLog_({ action: 'RESTORE_FOLDER', projectId: projectId || '', targetType: 'FOLDER', targetName: result.title || before.title || '', targetId: folderId, status: 'success', message: '已還原資料夾' });
    return { success: true, folderId, name: result.title || '', status: 'active', message: '已還原資料夾' };
  } catch (e) {
    return { success: false, folderId, status: 'error', message: e.message };
  }
}

function restoreFoldersBatch(folderIds, projectId) {
  const ids = Array.from(new Set((folderIds || []).map(extractGoogleDriveId_).filter(Boolean)));
  const results = ids.map(id => restoreFolder(id, projectId));
  return {
    success: true,
    total: results.length,
    successCount: results.filter(x => x.success).length,
    errorCount: results.filter(x => !x.success).length,
    results
  };
}

function syncProjectFolderStatus(projectId) {
  try {
    const list = getProjectFolders(projectId);
    if (!list.success) throw new Error(list.message);
    const results = list.folders.map(folder => {
      const status = getDriveFolderStatus(folder.folderId);
      const newStatus = status.success ? status.status : (status.status || 'error');
      updateFolderStatus_(folder.folderId, newStatus, status.message || '同步 Drive 狀態');
      return Object.assign({}, folder, status);
    });
    writeSystemLog_({ action: 'SYNC_FOLDER_STATUS', projectId: projectId || '', targetType: 'PROJECT', targetName: '', targetId: projectId || '', status: 'success', message: '同步 ' + results.length + ' 筆資料夾狀態' });
    return { success: true, total: results.length, results };
  } catch (e) {
    return { success: false, message: e.message, results: [] };
  }
}

function updateFolderStatus_(folderId, status, message) {
  const db = getDatabase_();
  const sheet = db.getSheetByName('Folders');
  if (!sheet || sheet.getLastRow() < 2) return;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][3]) === String(folderId)) {
      sheet.getRange(i + 2, 8).setValue(status);
      sheet.getRange(i + 2, 9).setValue(message || '');
      return;
    }
  }
}

/* ===================== Database ===================== */

function initializeDatabase() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty(DB_PROPERTY_KEY);
  if (spreadsheetId) {
    try {
      const existing = SpreadsheetApp.openById(spreadsheetId);
      return { success: true, created: false, spreadsheetId, spreadsheetUrl: existing.getUrl(), spreadsheetName: existing.getName() };
    } catch (e) {
      properties.deleteProperty(DB_PROPERTY_KEY);
      spreadsheetId = '';
    }
  }

  const spreadsheet = SpreadsheetApp.create('Drive Folder Manager Database');
  spreadsheetId = spreadsheet.getId();
  properties.setProperty(DB_PROPERTY_KEY, spreadsheetId);
  const defaultSheet = spreadsheet.getSheets()[0];

  createDatabaseSheet_(spreadsheet, 'Projects', ['projectId','projectName','description','driveType','parentFolderId','parentFolderUrl','createdBy','createdAt','updatedAt','status']);
  createDatabaseSheet_(spreadsheet, 'Folders', ['folderRecordId','projectId','folderName','folderId','folderUrl','parentFolderId','level','status','message','createdAt']);
  createDatabaseSheet_(spreadsheet, 'Permissions', ['permissionRecordId','projectId','folderId','folderName','email','role','status','message','createdAt']);
  createDatabaseSheet_(spreadsheet, 'Templates', ['templateId','templateName','description','folderStructureJson','createdBy','createdAt','updatedAt']);
  createDatabaseSheet_(spreadsheet, 'PermissionTemplates', ['templateId','templateName','description','permissionRulesJson','createdBy','createdAt','updatedAt']);
  createDatabaseSheet_(spreadsheet, 'Logs', ['logId','timestamp','userEmail','action','projectId','targetType','targetName','targetId','status','message']);
  createDatabaseSheet_(spreadsheet, 'Settings', ['key','value','description','updatedAt']);
  spreadsheet.deleteSheet(defaultSheet);

  const settings = spreadsheet.getSheetByName('Settings');
  settings.appendRow(['SYSTEM_VERSION', APP_VERSION, '目前系統版本', new Date()]);
  settings.appendRow(['DEFAULT_DUPLICATE_ACTION', 'skip', '重複資料夾預設處理', new Date()]);
  settings.appendRow(['DELETE_MODE', 'trash_only', 'v3.1 僅允許移到垃圾桶，不提供永久刪除', new Date()]);

  writeSystemLog_({ action: 'INITIALIZE_DATABASE', targetType: 'SYSTEM', targetName: 'Drive Folder Manager Database', targetId: spreadsheetId, status: 'success', message: 'v3.4 系統資料庫建立完成' });
  return { success: true, created: true, spreadsheetId, spreadsheetUrl: spreadsheet.getUrl(), spreadsheetName: spreadsheet.getName() };
}

function createDatabaseSheet_(spreadsheet, sheetName, headers) {
  const sheet = spreadsheet.insertSheet(sheetName);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function getDatabase_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(DB_PROPERTY_KEY);
  if (!spreadsheetId) throw new Error('系統資料庫尚未初始化。請先執行 initializeDatabase()。');
  return SpreadsheetApp.openById(spreadsheetId);
}

function getDatabaseInfo() {
  try {
    const db = getDatabase_();
    return { success: true, spreadsheetId: db.getId(), spreadsheetName: db.getName(), spreadsheetUrl: db.getUrl() };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function saveFolderRecord_(data) {
  const sheet = getDatabase_().getSheetByName('Folders');
  sheet.appendRow([
    Utilities.getUuid(), data.projectId || '', data.folderName || '', data.folderId || '', data.folderUrl || '',
    data.parentFolderId || '', data.level || 0, data.status || '', data.message || '', new Date()
  ]);
}

function savePermissionRecord_(data) {
  const sheet = getDatabase_().getSheetByName('Permissions');
  sheet.appendRow([
    Utilities.getUuid(), data.projectId || '', data.folderId || '', data.folderName || '', data.email || '',
    data.role || '', data.status || '', data.message || '', new Date()
  ]);
}

function writeSystemLog_(data) {
  try {
    const sheet = getDatabase_().getSheetByName('Logs');
    let userEmail = '';
    try { userEmail = Session.getActiveUser().getEmail() || ''; } catch (e) {}
    sheet.appendRow([
      Utilities.getUuid(), new Date(), userEmail, data.action || '', data.projectId || '', data.targetType || '',
      data.targetName || '', data.targetId || '', data.status || '', data.message || ''
    ]);
  } catch (e) {
    console.error('寫入 Logs 失敗：' + e.message);
  }
}

/* ===================== Project Management ===================== */

function createProject(projectData) {
  try {
    if (!projectData) throw new Error('未提供專案資料。');

    const projectName = String(projectData.projectName || '').trim();
    if (!projectName) throw new Error('請輸入專案名稱。');

    // v3.7：建立專案可選兩種模式：
    // 1) create：在使用者指定的上層母資料夾內，自動建立「專案名稱」資料夾，
    //    並把該資料夾自動帶入「1. 建立位置與規則」。
    // 2) existing：只建立專案紀錄，不建立 Drive 資料夾；使用者之後自行在
    //    「1. 建立位置與規則」貼上原本／既有資料夾 ID 或網址。
    const folderMode = String(projectData.folderMode || 'create').trim();
    if (!['create', 'existing'].includes(folderMode)) {
      throw new Error('不支援的專案資料夾模式。');
    }

    let projectFolderId = '';
    let projectFolderUrl = '';
    let rootParentFolderId = '';
    let projectFolderCreated = false;
    let projectFolderReused = false;

    if (folderMode === 'create') {
      rootParentFolderId = extractGoogleDriveId_(projectData.parentFolderId || '');
      if (!rootParentFolderId) throw new Error('請輸入上層母資料夾 ID 或網址。');

      const rootParent = Drive.Files.get(rootParentFolderId, { supportsAllDrives: true });
      if (!rootParent) throw new Error('找不到指定的上層母資料夾。');
      if (rootParent.mimeType !== FOLDER_MIME_TYPE) throw new Error('指定的位置不是 Google Drive 資料夾。');
      if (rootParent.labels && rootParent.labels.trashed) throw new Error('指定的上層母資料夾目前在垃圾桶中。');

      const projectFolderResult = getOrCreateFolder_(rootParentFolderId, projectName, 'skip');
      projectFolderId = projectFolderResult.folder.id;
      projectFolderUrl = 'https://drive.google.com/drive/folders/' + projectFolderId;
      projectFolderCreated = !projectFolderResult.skipped;
      projectFolderReused = !!projectFolderResult.skipped;
    }

    const sheet = getDatabase_().getSheetByName('Projects');
    const projectId = 'P-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().substring(0, 8);
    const now = new Date();
    let userEmail = '';
    try { userEmail = Session.getActiveUser().getEmail() || ''; } catch (e) {}
    const driveType = String(projectData.driveType || 'myDrive');

    sheet.appendRow([
      projectId,
      projectName,
      String(projectData.description || ''),
      driveType,
      projectFolderId,
      projectFolderUrl,
      userEmail,
      now,
      now,
      'active'
    ]);

    if (folderMode === 'create') {
      writeSystemLog_({
        action: 'CREATE_PROJECT_FOLDER',
        projectId,
        targetType: 'FOLDER',
        targetName: projectName,
        targetId: projectFolderId,
        status: projectFolderReused ? 'warning' : 'success',
        message: projectFolderReused
          ? '上層母資料夾已存在同名專案資料夾，已沿用既有資料夾'
          : '已在上層母資料夾建立專案名稱資料夾'
      });
    }

    writeSystemLog_({
      action: 'CREATE_PROJECT',
      projectId,
      targetType: 'PROJECT',
      targetName: projectName,
      targetId: projectId,
      status: 'success',
      message: folderMode === 'create'
        ? '建立專案成功；專案資料夾：' + projectFolderId
        : '建立專案成功；使用既有資料夾模式，等待使用者自行設定母資料夾'
    });

    const message = folderMode === 'create'
      ? (projectFolderReused
          ? '專案建立成功。上層母資料夾已有同名資料夾，已沿用並自動帶入「1. 建立位置與規則」。'
          : '專案建立成功，已建立同名專案資料夾並自動帶入「1. 建立位置與規則」。')
      : '專案建立成功。請到「1. 建立位置與規則」自行貼上原本／既有資料夾 ID 或網址。';

    return {
      success: true,
      folderMode,
      projectFolderCreated,
      projectFolderReused,
      message,
      project: {
        projectId,
        projectName,
        description: String(projectData.description || ''),
        driveType,
        parentFolderId: projectFolderId,
        parentFolderUrl: projectFolderUrl,
        rootParentFolderId,
        folderMode,
        createdBy: userEmail,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: 'active'
      }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getProjects() {
  try {
    const sheet = getDatabase_().getSheetByName('Projects');
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, projects: [] };
    const values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    const projects = values.filter(row => row[0]).map(row => ({
      projectId: row[0], projectName: row[1], description: row[2], driveType: row[3], parentFolderId: row[4], parentFolderUrl: row[5], createdBy: row[6],
      createdAt: row[7] instanceof Date ? row[7].toISOString() : row[7],
      updatedAt: row[8] instanceof Date ? row[8].toISOString() : row[8], status: row[9]
    }));
    projects.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { success: true, projects };
  } catch (e) {
    return { success: false, message: e.message, projects: [] };
  }
}

function getProject(projectId) {
  try {
    const result = getProjects();
    if (!result.success) throw new Error(result.message);
    const project = result.projects.find(item => item.projectId === projectId);
    if (!project) throw new Error('找不到指定專案。');
    return { success: true, project };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function updateProject(projectData) {
  try {
    if (!projectData || !projectData.projectId) throw new Error('缺少 projectId。');
    const sheet = getDatabase_().getSheetByName('Projects');
    const values = sheet.getDataRange().getValues();
    let targetRow = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(projectData.projectId)) { targetRow = i + 1; break; }
    }
    if (targetRow === -1) throw new Error('找不到指定專案。');
    const current = sheet.getRange(targetRow, 1, 1, 10).getValues()[0];
    const projectName = String(projectData.projectName !== undefined ? projectData.projectName : current[1]).trim();
    const description = projectData.description !== undefined ? String(projectData.description) : current[2];
    const driveType = projectData.driveType !== undefined ? String(projectData.driveType) : current[3];
    const parentFolderId = projectData.parentFolderId !== undefined ? extractGoogleDriveId_(projectData.parentFolderId) : current[4];
    const parentFolderUrl = parentFolderId ? 'https://drive.google.com/drive/folders/' + parentFolderId : '';
    const status = projectData.status !== undefined ? projectData.status : current[9];
    sheet.getRange(targetRow, 2, 1, 9).setValues([[projectName, description, driveType, parentFolderId, parentFolderUrl, current[6], current[7], new Date(), status]]);
    writeSystemLog_({ action: 'UPDATE_PROJECT', projectId: projectData.projectId, targetType: 'PROJECT', targetName: projectName, targetId: projectData.projectId, status: 'success', message: '更新專案成功' });
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function archiveProject(projectId) { return updateProject({ projectId, status: 'archived' }); }

/**
 * 永久刪除「專案紀錄」
 * 注意：此功能只刪除本系統 Google Sheets 資料庫中的專案與關聯紀錄，
 * 不會刪除 Google Drive 上的實體資料夾或檔案。
 * 為避免誤刪，前端必須傳入完全相同的專案名稱作為二次確認。
 */
function deleteProject(projectId, confirmProjectName) {
  try {
    projectId = String(projectId || '').trim();
    confirmProjectName = String(confirmProjectName || '').trim();
    if (!projectId) throw new Error('缺少 projectId。');

    const projectResult = getProject(projectId);
    if (!projectResult.success) throw new Error(projectResult.message || '找不到指定專案。');
    const project = projectResult.project;

    if (!confirmProjectName || confirmProjectName !== String(project.projectName || '').trim()) {
      throw new Error('確認名稱不正確，已取消刪除專案。');
    }

    const db = getDatabase_();

    // 先留下稽核紀錄；不刪除 Logs，保留誰在何時刪除專案的紀錄。
    writeSystemLog_({
      action: 'DELETE_PROJECT',
      projectId: projectId,
      targetType: 'PROJECT',
      targetName: project.projectName,
      targetId: projectId,
      status: 'success',
      message: '刪除專案紀錄；Google Drive 實體資料夾未刪除'
    });

    const deletedFolders = deleteRowsByProjectId_(db.getSheetByName('Folders'), 2, projectId);
    const deletedPermissions = deleteRowsByProjectId_(db.getSheetByName('Permissions'), 2, projectId);
    const deletedProjects = deleteRowsByProjectId_(db.getSheetByName('Projects'), 1, projectId);

    if (!deletedProjects) throw new Error('找不到可刪除的專案紀錄。');

    return {
      success: true,
      projectId: projectId,
      projectName: project.projectName,
      deletedProjects: deletedProjects,
      deletedFolders: deletedFolders,
      deletedPermissions: deletedPermissions,
      driveFoldersDeleted: 0,
      message: '專案紀錄已刪除，Google Drive 資料夾未刪除。'
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * 從指定工作表刪除符合 projectId 的資料列。
 * projectIdColumn 為 1-based 欄位編號。
 */
function deleteRowsByProjectId_(sheet, projectIdColumn, projectId) {
  if (!sheet || sheet.getLastRow() < 2) return 0;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const rowsToDelete = [];

  values.forEach(function(row, index) {
    if (String(row[projectIdColumn - 1]) === String(projectId)) {
      rowsToDelete.push(index + 2);
    }
  });

  // 必須由下往上刪除，避免列號位移。
  rowsToDelete.reverse().forEach(function(rowNumber) {
    sheet.deleteRow(rowNumber);
  });

  return rowsToDelete.length;
}


function getParentFolderId_(folderId) {
  try {
    const file = Drive.Files.get(folderId, { supportsAllDrives: true });
    const parents = file.parents || [];
    return parents.length && parents[0].id ? parents[0].id : '';
  } catch (e) {
    return '';
  }
}

function duplicateProject(projectId) {
  try {
    const result = getProject(projectId);
    if (!result.success) throw new Error(result.message);
    const p = result.project;

    // 若原專案已有專案資料夾，副本建立在其上一層；
    // 若原專案屬於「使用既有資料夾／尚未設定母資料夾」模式，
    // 副本只複製專案紀錄，讓使用者自行設定母資料夾。
    if (p.parentFolderId) {
      const rootParentFolderId = getParentFolderId_(p.parentFolderId);
      if (!rootParentFolderId) throw new Error('無法取得原專案資料夾的上一層位置，無法建立專案副本。');

      return createProject({
        projectName: p.projectName + ' - 副本',
        description: p.description,
        driveType: p.driveType,
        folderMode: 'create',
        parentFolderId: rootParentFolderId
      });
    }

    return createProject({
      projectName: p.projectName + ' - 副本',
      description: p.description,
      driveType: p.driveType,
      folderMode: 'existing',
      parentFolderId: ''
    });
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function testV31Database() { return initializeDatabase(); }


/* ===================== v3.2 專案優化 ===================== */

/**
 * 解除封存專案
 */
function restoreProject(projectId) {
  return updateProject({ projectId: projectId, status: 'active' });
}

/**
 * 專案儀表板統計
 */
function getProjectDashboardStats(projectId) {
  try {
    projectId = String(projectId || '').trim();
    if (!projectId) throw new Error('缺少 projectId。');

    const folderResult = getProjectFolders(projectId);
    if (!folderResult.success) throw new Error(folderResult.message || '無法讀取資料夾紀錄');
    const folders = folderResult.folders || [];

    const counts = { total: folders.length, active: 0, trashed: 0, missing: 0, error: 0, skipped: 0 };
    folders.forEach(function(f) {
      const s = String(f.status || 'active');
      if (s === 'success') counts.active++;
      else if (Object.prototype.hasOwnProperty.call(counts, s)) counts[s]++;
      else counts.error++;
    });

    const db = getDatabase_();
    let permissionCount = 0;
    let logCount = 0;
    let latestActivity = '';

    const permissionSheet = db.getSheetByName('Permissions');
    if (permissionSheet && permissionSheet.getLastRow() >= 2) {
      const values = permissionSheet.getRange(2, 1, permissionSheet.getLastRow() - 1, 9).getValues();
      permissionCount = values.filter(function(row) { return String(row[1]) === projectId; }).length;
    }

    const logSheet = db.getSheetByName('Logs');
    if (logSheet && logSheet.getLastRow() >= 2) {
      const values = logSheet.getRange(2, 1, logSheet.getLastRow() - 1, 10).getValues();
      const logs = values.filter(function(row) { return String(row[4]) === projectId; });
      logCount = logs.length;
      if (logs.length) {
        const latest = logs[logs.length - 1][1];
        latestActivity = latest instanceof Date ? latest.toISOString() : String(latest || '');
      }
    }

    return {
      success: true,
      stats: {
        totalFolders: counts.total,
        activeFolders: counts.active,
        trashedFolders: counts.trashed,
        missingFolders: counts.missing,
        errorFolders: counts.error,
        skippedFolders: counts.skipped,
        permissionCount: permissionCount,
        logCount: logCount,
        latestActivity: latestActivity
      }
    };
  } catch (e) {
    return { success: false, message: e.message, stats: {} };
  }
}

/**
 * 取得單一專案最近操作紀錄
 */
function getProjectRecentLogs(projectId, limit) {
  try {
    projectId = String(projectId || '').trim();
    limit = Math.max(1, Math.min(Number(limit || 10), 50));
    const db = getDatabase_();
    const sheet = db.getSheetByName('Logs');
    if (!sheet || sheet.getLastRow() < 2) return { success: true, logs: [] };
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
    const logs = values
      .filter(function(row) { return String(row[4]) === projectId; })
      .slice(-limit)
      .reverse()
      .map(function(row) {
        return {
          logId: row[0],
          timestamp: row[1] instanceof Date ? row[1].toISOString() : row[1],
          userEmail: row[2],
          action: row[3],
          projectId: row[4],
          targetType: row[5],
          targetName: row[6],
          targetId: row[7],
          status: row[8],
          message: row[9]
        };
      });
    return { success: true, logs: logs };
  } catch (e) {
    return { success: false, message: e.message, logs: [] };
  }
}

function testDriveApi() {
  const result = Drive.Files.list({ maxResults: 5, q: 'trashed = false' });
  return { success: true, count: (result.items || []).length };
}
