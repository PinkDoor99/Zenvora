const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Store authentication token
let authToken = null;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'icon.png'), // Add an icon if available
  });

  // Load the local Next.js app
  mainWindow.loadURL('http://localhost:3000');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Authentication IPC handlers
ipcMain.handle('set-auth-token', (event, token) => {
  authToken = token;
});

ipcMain.handle('clear-auth-token', () => {
  authToken = null;
});

// Generic API call helper with authentication
async function apiCall(endpoint, data = {}, method = 'POST') {
  const axios = require('axios');
  const headers = { 'Content-Type': 'application/json' };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await axios({
      method,
      url: `http://localhost:5000${endpoint}`,
      headers,
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' ? data : undefined
    });
    return response.data;
  } catch (error) {
    return { error: error.response?.data?.error || error.message };
  }
}

// IPC handlers for communication with renderer
ipcMain.handle('run-code', async (event, code, projectId) => {
  return await apiCall('/execute', { code, projectId });
});

ipcMain.handle('ask-ai', async (event, question) => {
  // Call local Ollama directly (no auth needed)
  const axios = require('axios');
  try {
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'llama3.2:1b',
      messages: [{ role: 'user', content: question }],
      stream: false
    });
    return response.data.message.content;
  } catch (error) {
    return 'Error: ' + error.message;
  }
});

ipcMain.handle('generate-code', async (event, prompt, projectId) => {
  return await apiCall('/generate-code', { prompt, projectId });
});

ipcMain.handle('execute-task', async (event, task, projectId) => {
  return await apiCall('/execute-task', { task, projectId });
});

ipcMain.handle('review-code', async (event, code, language, projectId) => {
  return await apiCall('/review-code', { code, language: language || 'javascript', projectId });
});

ipcMain.handle('debug-error', async (event, error, code, projectId) => {
  return await apiCall('/debug-error', { error, code, projectId });
});

// Authentication handlers
ipcMain.handle('auth-login', async (event, credentials) => {
  const result = await apiCall('/auth/login', credentials);
  if (result.token) {
    authToken = result.token;
  }
  return result;
});

ipcMain.handle('auth-register', async (event, userData) => {
  const result = await apiCall('/auth/register', userData);
  if (result.token) {
    authToken = result.token;
  }
  return result;
});

ipcMain.handle('auth-logout', async (event) => {
  await apiCall('/auth/logout', {}, 'POST');
  authToken = null;
  return { success: true };
});

ipcMain.handle('auth-me', async (event) => {
  return await apiCall('/auth/me', {}, 'GET');
});

// Project handlers
ipcMain.handle('projects-get', async (event) => {
  return await apiCall('/projects', {}, 'GET');
});

ipcMain.handle('projects-create', async (event, projectData) => {
  return await apiCall('/projects', projectData);
});

// Multi-language handlers
ipcMain.handle('detect-language', async (event, code, filePath) => {
  return await apiCall('/detect-language', { code, filePath });
});

ipcMain.handle('generate-code-multi', async (event, prompt, language, frameworks, projectId) => {
  return await apiCall('/generate-code-multi', { prompt, language, frameworks, projectId });
});

ipcMain.handle('review-code-multi', async (event, code, language, frameworks, projectId) => {
  return await apiCall('/review-code-multi', { code, language, frameworks, projectId });
});

ipcMain.handle('debug-error-multi', async (event, error, code, language, frameworks, projectId) => {
  return await apiCall('/debug-error-multi', { error, code, language, frameworks, projectId });
});

ipcMain.handle('analyze-code', async (event, code, language, filePath) => {
  return await apiCall('/analyze-code', { code, language, filePath });
});

ipcMain.handle('format-code', async (event, code, language) => {
  return await apiCall('/format-code', { code, language });
});

ipcMain.handle('get-suggestions', async (event, code, language, frameworks, context) => {
  return await apiCall('/suggest-improvements', { code, language, frameworks, context });
});

ipcMain.handle('convert-code', async (event, code, fromLanguage, toLanguage, frameworks) => {
  return await apiCall('/convert-code', { code, fromLanguage, toLanguage, frameworks });
});

ipcMain.handle('get-languages', async (event) => {
  return await apiCall('/languages', {}, 'GET');
});

ipcMain.handle('get-tools', async (event, language) => {
  return await apiCall(`/tools/${language}`, {}, 'GET');
});