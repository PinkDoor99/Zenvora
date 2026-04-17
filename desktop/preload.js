const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Code execution functions
  runCode: (code, projectId) => ipcRenderer.invoke('run-code', code, projectId),
  askAI: (question) => ipcRenderer.invoke('ask-ai', question),
  generateCode: (prompt, projectId) => ipcRenderer.invoke('generate-code', prompt, projectId),
  executeTask: (task, projectId) => ipcRenderer.invoke('execute-task', task, projectId),
  reviewCode: (code, language, projectId) => ipcRenderer.invoke('review-code', code, language, projectId),
  debugError: (error, code, projectId) => ipcRenderer.invoke('debug-error', error, code, projectId),

  // Authentication functions
  setAuthToken: (token) => ipcRenderer.invoke('set-auth-token', token),
  clearAuthToken: () => ipcRenderer.invoke('clear-auth-token'),
  authLogin: (credentials) => ipcRenderer.invoke('auth-login', credentials),
  authRegister: (userData) => ipcRenderer.invoke('auth-register', userData),
  authLogout: () => ipcRenderer.invoke('auth-logout'),
  authMe: () => ipcRenderer.invoke('auth-me'),

  // Project functions
  getProjects: () => ipcRenderer.invoke('projects-get'),
  createProject: (projectData) => ipcRenderer.invoke('projects-create', projectData),

  // Multi-language functions
  detectLanguage: (code, filePath) => ipcRenderer.invoke('detect-language', code, filePath),
  generateCodeMulti: (prompt, language, frameworks, projectId) => ipcRenderer.invoke('generate-code-multi', prompt, language, frameworks, projectId),
  reviewCodeMulti: (code, language, frameworks, projectId) => ipcRenderer.invoke('review-code-multi', code, language, frameworks, projectId),
  debugErrorMulti: (error, code, language, frameworks, projectId) => ipcRenderer.invoke('debug-error-multi', error, code, language, frameworks, projectId),
  analyzeCode: (code, language, filePath) => ipcRenderer.invoke('analyze-code', code, language, filePath),
  formatCode: (code, language) => ipcRenderer.invoke('format-code', code, language),
  getSuggestions: (code, language, frameworks, context) => ipcRenderer.invoke('get-suggestions', code, language, frameworks, context),
  convertCode: (code, fromLanguage, toLanguage, frameworks) => ipcRenderer.invoke('convert-code', code, fromLanguage, toLanguage, frameworks),
  getLanguages: () => ipcRenderer.invoke('get-languages'),
  getTools: (language) => ipcRenderer.invoke('get-tools', language),
});