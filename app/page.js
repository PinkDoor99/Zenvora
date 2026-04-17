'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function Home() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);

  // Project state
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Code editor state
  const [code, setCode] = useState("// Welcome to Zenvora Enterprise IDE\nconsole.log('Hello World!');\n\n// Try running some JavaScript code...");
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // AI state
  const [aiInput, setAiInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Admin state
  const [adminView, setAdminView] = useState('dashboard'); // 'dashboard', 'users', 'audit'
  const [adminData, setAdminData] = useState({ users: [], auditLogs: [] });

  // Multi-language state
  const [currentLanguage, setCurrentLanguage] = useState('javascript');
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [codeAnalysis, setCodeAnalysis] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Load user session on mount
  useEffect(() => {
    const token = localStorage.getItem('zenvora_token');
    if (token) {
      fetch(`${apiUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          loadUserProjects();
        }
      })
      .catch(() => localStorage.removeItem('zenvora_token'));
    }
  }, []);

  // Authentication functions
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login'
        ? { usernameOrEmail: authForm.username, password: authForm.password }
        : authForm;

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('zenvora_token', data.token);
        setUser(data.user);
        setAuthForm({ username: '', email: '', password: '' });
        loadUserProjects();
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }

    setAuthLoading(false);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('zenvora_token');
    if (token) {
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    localStorage.removeItem('zenvora_token');
    setUser(null);
    setProjects([]);
    setCurrentProject(null);
  };

  // Project functions
  const loadUserProjects = async () => {
    const token = localStorage.getItem('zenvora_token');
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('zenvora_token');
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectForm)
      });

      const data = await response.json();
      if (response.ok) {
        setProjects([...projects, data.project]);
        setProjectForm({ name: '', description: '' });
        setShowProjectModal(false);
      } else {
        alert(data.error || 'Failed to create project');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  // Code execution functions
  const runCode = async () => {
    setLoading(true);
    setOutput('Executing code...');

    const token = localStorage.getItem('zenvora_token');

    try {
      const response = await fetch(`${apiUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          code,
          projectId: currentProject?.id
        })
      });

      const data = await response.json();

      if (data.error) {
        setOutput(`❌ Error: ${data.error}`);
      } else {
        setOutput(`✅ Output (${data.executionTime}ms):\n${data.result}`);
      }
    } catch (err) {
      setOutput(`❌ Error: ${err.message}`);
    }
    setLoading(false);
  };

  // AI functions
  const askAI = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiOutput('Thinking...');

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2:1b',
          messages: [{ role: 'user', content: aiInput }],
          stream: false
        })
      });
      const data = await response.json();
      setAiOutput(data.message.content);
    } catch (err) {
      setAiOutput(`Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const generateCode = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiOutput('Generating code...');

    const token = localStorage.getItem('zenvora_token');

    try {
      const response = await fetch(`${apiUrl}/generate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          prompt: aiInput,
          projectId: currentProject?.id
        })
      });

      const data = await response.json();

      if (data.error) {
        setAiOutput(`❌ Error: ${data.error}`);
      } else {
        setAiOutput(`✅ Generated Code:\n${data.result}`);
      }
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const executeTask = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiOutput('Executing task...');

    const token = localStorage.getItem('zenvora_token');

    try {
      const response = await fetch(`${apiUrl}/execute-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          task: aiInput,
          projectId: currentProject?.id
        })
      });

      const data = await response.json();

      if (data.error) {
        setAiOutput(`❌ Error: ${data.error}`);
      } else {
        let output = `✅ Task Completed:\n${data.output}\n\n`;
        if (data.intermediateSteps) {
          output += 'Steps taken:\n';
          data.intermediateSteps.forEach((step, i) => {
            output += `${i + 1}. ${step.action.tool}(${JSON.stringify(step.action.toolInput)})\n`;
            output += `   Result: ${step.observation}\n\n`;
          });
        }
        setAiOutput(output);
      }
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const reviewCode = async () => {
    if (!code.trim()) return;
    setAiLoading(true);
    setAiOutput('Reviewing code...');

    const token = localStorage.getItem('zenvora_token');

    try {
      const response = await fetch(`${apiUrl}/review-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          code,
          language: 'javascript',
          projectId: currentProject?.id
        })
      });

      const data = await response.json();
      setAiOutput(`🔍 Code Review:\n${data.result}`);
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const debugError = async () => {
    const errorMatch = output.match(/❌ Error: (.+)/);
    if (!errorMatch || !code.trim()) {
      setAiOutput('No error found to debug. Run code first to generate an error.');
      return;
    }
    const errorMsg = errorMatch[1];
    setAiLoading(true);
    setAiOutput('Debugging error...');

    const token = localStorage.getItem('zenvora_token');

    try {
      const response = await fetch(`${apiUrl}/debug-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          error: errorMsg,
          code,
          projectId: currentProject?.id
        })
      });

      const data = await response.json();
      setAiOutput(`🐛 Debug Analysis:\n${data.result}`);
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  // Multi-language functions
  const detectLanguage = async () => {
    if (!code.trim()) return;

    try {
      const response = await fetch(`${apiUrl}/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      if (response.ok) {
        setDetectedLanguage(data);
        setCurrentLanguage(data.language);
        setFrameworks(data.frameworks);
        setShowLanguageModal(true);
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    }
  };

  const analyzeCode = async () => {
    if (!code.trim()) return;
    setAiLoading(true);
    setAiOutput('Analyzing code...');

    try {
      const response = await fetch(`${apiUrl}/analyze-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: currentLanguage
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCodeAnalysis(data);
        let output = `🔍 Code Analysis (${data.tool || 'unknown tool'}):\n\n`;
        if (data.issues && data.issues.length > 0) {
          data.issues.forEach((issue, i) => {
            output += `${i + 1}. [${issue.severity?.toUpperCase()}] `;
            if (issue.line) output += `Line ${issue.line}: `;
            output += `${issue.message}\n`;
          });
        } else {
          output += '✅ No issues found!\n';
        }
        if (data.output) {
          output += `\nTool Output:\n${data.output}`;
        }
        setAiOutput(output);
      } else {
        setAiOutput(`❌ Analysis failed: ${data.error}`);
      }
    } catch (error) {
      setAiOutput(`❌ Error: ${error.message}`);
    }
    setAiLoading(false);
  };

  const formatCode = async () => {
    if (!code.trim()) return;
    setAiLoading(true);
    setAiOutput('Formatting code...');

    try {
      const response = await fetch(`${apiUrl}/format-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: currentLanguage
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCode(data.formattedCode);
        setAiOutput(`✅ Code formatted using ${data.tool}\n\nFormatted code has been applied to the editor.`);
      } else {
        setAiOutput(`❌ Formatting failed: ${data.output || data.error}`);
      }
    } catch (error) {
      setAiOutput(`❌ Error: ${error.message}`);
    }
    setAiLoading(false);
  };

  const getSuggestions = async () => {
    if (!code.trim()) return;
    setAiLoading(true);
    setAiOutput('Getting suggestions...');

    try {
      const response = await fetch(`${apiUrl}/suggest-improvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: currentLanguage,
          frameworks
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiOutput(`💡 Code Suggestions:\n${data.suggestions}`);
      } else {
        setAiOutput(`❌ Failed to get suggestions: ${data.error}`);
      }
    } catch (error) {
      setAiOutput(`❌ Error: ${error.message}`);
    }
    setAiLoading(false);
  };

  const convertCode = async (toLanguage) => {
    if (!code.trim()) return;
    setAiLoading(true);
    setAiOutput(`Converting to ${toLanguage}...`);

    try {
      const response = await fetch(`${apiUrl}/convert-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          fromLanguage: currentLanguage,
          toLanguage,
          frameworks
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCode(data.convertedCode);
        setCurrentLanguage(toLanguage);
        setAiOutput(`✅ Code converted from ${currentLanguage} to ${toLanguage}\n\nConverted code has been applied to the editor.`);
      } else {
        setAiOutput(`❌ Conversion failed: ${data.error}`);
      }
    } catch (error) {
      setAiOutput(`❌ Error: ${error.message}`);
    }
    setAiLoading(false);
  };

  const loadSupportedLanguages = async () => {
    try {
      const response = await fetch(`${apiUrl}/languages`);
      const data = await response.json();
      if (response.ok) {
        setSupportedLanguages(data.supportedLanguages);
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  // Enhanced AI functions with multi-language support
  const generateCodeMulti = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiOutput('Generating code...');

    const token = localStorage.getItem('zenvora_token');

    try {
      const response = await fetch(`${apiUrl}/generate-code-multi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          prompt: aiInput,
          language: currentLanguage,
          frameworks,
          projectId: currentProject?.id
        })
      });

      const data = await response.json();

      if (data.error) {
        setAiOutput(`❌ Error: ${data.error}`);
      } else {
        setAiOutput(`✅ Generated ${data.language} Code:\n${data.code}`);
      }
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const reviewCodeMulti = async () => {
    if (!code.trim()) return;
    setAiLoading(true);
    setAiOutput('Reviewing code...');

    const token = localStorage.getItem('zenvora_token');

    try {
      const response = await fetch(`${apiUrl}/review-code-multi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          code,
          language: currentLanguage,
          frameworks,
          projectId: currentProject?.id
        })
      });

      const data = await response.json();
      setAiOutput(`🔍 Code Review (${data.language}):\n${data.review}`);
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const debugErrorMulti = async () => {
    const errorMatch = output.match(/❌ Error: (.+)/);
    if (!errorMatch || !code.trim()) {
      setAiOutput('No error found to debug. Run code first to generate an error.');
      return;
    }
    const errorMsg = errorMatch[1];
    setAiLoading(true);
    setAiOutput('Debugging error...');

    const token = localStorage.getItem('zenvora_token');

    try {
      const response = await fetch(`${apiUrl}/debug-error-multi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          error: errorMsg,
          code,
          language: currentLanguage,
          frameworks,
          projectId: currentProject?.id
        })
      });

      const data = await response.json();
      setAiOutput(`🐛 Debug Analysis (${data.language}):\n${data.debug}`);
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  // Load supported languages on mount
  useEffect(() => {
    loadSupportedLanguages();
  }, []);

  // Admin functions
  const loadAdminData = async (view) => {
    const token = localStorage.getItem('zenvora_token');
    if (!token || user?.role !== 'admin') return;

    try {
      if (view === 'users') {
        const response = await fetch(`${apiUrl}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setAdminData(prev => ({ ...prev, users: data.users || [] }));
      } else if (view === 'audit') {
        const response = await fetch(`${apiUrl}/admin/audit-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setAdminData(prev => ({ ...prev, auditLogs: data.logs || [] }));
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  // If not authenticated, show auth form
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: '#1e293b',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '32px', color: '#f1f5f9' }}>
            🚀 Zenvora Enterprise
          </h1>

          <div style={{ display: 'flex', marginBottom: '24px' }}>
            <button
              onClick={() => setAuthMode('login')}
              style={{
                flex: 1,
                padding: '12px',
                background: authMode === 'login' ? '#3b82f6' : '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '8px 0 0 8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('register')}
              style={{
                flex: 1,
                padding: '12px',
                background: authMode === 'register' ? '#3b82f6' : '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '0 8px 8px 0',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                {authMode === 'login' ? 'Username or Email' : 'Username'}
              </label>
              <input
                type="text"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>

            {authMode === 'register' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                Password
              </label>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
                minLength="6"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: authLoading ? '#64748b' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                opacity: authLoading ? 0.7 : 1
              }}
            >
              {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Register')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#64748b' }}>
            Secure enterprise-grade authentication with audit logging
          </p>
        </div>
      </div>
    );
  }

  // Main authenticated UI
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        padding: '16px 24px',
        backdropFilter: 'blur(10px)',
        background: 'rgba(15, 23, 42, 0.8)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>
            🚀 Zenvora Enterprise
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Welcome back, {user.username} ({user.role})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user.role === 'admin' && (
            <button
              onClick={() => {
                setAdminView('users');
                loadAdminData('users');
              }}
              style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Admin Panel
            </button>
          )}

          <button
            onClick={() => setShowProjectModal(true)}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            New Project
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Admin Panel */}
      {user.role === 'admin' && adminView !== 'dashboard' && (
        <div style={{
          padding: '24px',
          background: '#1e293b',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={() => setAdminView('users')}
            onClickCapture={() => loadAdminData('users')}
            style={{
              padding: '8px 16px',
              background: adminView === 'users' ? '#3b82f6' : '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Users
          </button>
          <button
            onClick={() => setAdminView('audit')}
            onClickCapture={() => loadAdminData('audit')}
            style={{
              padding: '8px 16px',
              background: adminView === 'audit' ? '#3b82f6' : '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setAdminView('dashboard')}
            style={{
              padding: '8px 16px',
              background: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Back to IDE
          </button>
        </div>
      )}

      {/* Admin Content */}
      {user.role === 'admin' && adminView === 'users' && (
        <div style={{ padding: '24px' }}>
          <h2>👥 User Management</h2>
          <div style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1' }}>Username</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1' }}>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {adminData.users.map(user => (
                  <tr key={user.id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                    <td style={{ padding: '12px', color: '#e2e8f0' }}>{user.username}</td>
                    <td style={{ padding: '12px', color: '#e2e8f0' }}>{user.email}</td>
                    <td style={{ padding: '12px', color: '#e2e8f0' }}>{user.role}</td>
                    <td style={{ padding: '12px', color: '#e2e8f0' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: user.is_active ? '#10b981' : '#ef4444',
                        color: 'white'
                      }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {user.role === 'admin' && adminView === 'audit' && (
        <div style={{ padding: '24px' }}>
          <h2>📊 Audit Logs</h2>
          <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px', maxHeight: '600px', overflow: 'auto' }}>
            {adminData.auditLogs.map(log => (
              <div key={log.id} style={{
                padding: '12px',
                marginBottom: '8px',
                background: '#0f172a',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#3b82f6', fontWeight: '600' }}>{log.action}</span>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
                  User: {log.username || 'Unknown'} | Resource: {log.resource_type} | IP: {log.ip_address}
                </div>
                {log.details && (
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                    {log.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main IDE Content */}
      {adminView === 'dashboard' && (
        <>
          {/* Projects Bar */}
          <div style={{
            padding: '16px 24px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            gap: '12px',
            overflowX: 'auto'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>Projects:</span>
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setCurrentProject(project)}
                  style={{
                    padding: '6px 12px',
                    background: currentProject?.id === project.id ? '#3b82f6' : '#334155',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {project.name}
                </button>
              ))}
              {projects.length === 0 && (
                <span style={{ color: '#64748b', fontSize: '12px' }}>No projects yet</span>
              )}
            </div>
          </div>

          {/* Main Content */}
          <main style={{
            flex: 1,
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto',
            padding: '32px 24px',
          }}>
            {/* Title */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: '#f1f5f9' }}>
                Code Editor
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                Execute JavaScript code in real-time • {currentProject ? `Project: ${currentProject.name}` : 'No project selected'}
              </p>
            </div>

            {/* Editor Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px'
            }}>
              {/* Code Editor Panel */}
              <div style={{
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{
                  background: '#0f172a',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#cbd5e1'
                }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span>
                  <select
                    value={currentLanguage}
                    onChange={(e) => setCurrentLanguage(e.target.value)}
                    style={{
                      background: '#1e293b',
                      color: '#e2e8f0',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    {supportedLanguages.map(lang => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>
                    Code {frameworks.length > 0 && `(${frameworks.join(', ')})`}
                  </span>
                  <button
                    onClick={detectLanguage}
                    style={{
                      marginLeft: 'auto',
                      padding: '2px 8px',
                      background: '#64748b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Detect
                  </button>
                </div>

                <Editor
                  height="100%"
                  language="javascript"
                  theme="vs-dark"
                  value={code}
                  onChange={setCode}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: '"Fira Code", "Monaco", monospace',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>

              {/* Output Panel */}
              <div style={{
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{
                  background: '#0f172a',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#cbd5e1'
                }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: output ? '#10b981' : '#64748b' }}></span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>
                    {output ? 'Output' : 'Ready'}
                  </span>
                </div>

                <pre style={{
                  flex: 1,
                  background: '#0f172a',
                  color: '#cbd5e1',
                  fontFamily: '"Fira Code", "Monaco", monospace',
                  fontSize: '13px',
                  padding: '16px',
                  margin: 0,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {output || 'Run code to see output...'}
                </pre>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={runCode}
              disabled={loading}
              style={{
                background: loading ? '#64748b' : '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                hover: { background: '#2563eb' }
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = '#2563eb')}
              onMouseOut={(e) => !loading && (e.target.style.background = '#3b82f6')}
            >
              {loading ? 'Executing...' : '▶ Run Code'}
            </button>

            {/* AI Chat Panel */}
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: '#f1f5f9' }}>
                🤖 AI Assistant
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                Ask questions or get code help from local AI
              </p>
              <div style={{ marginTop: '16px' }}>
                <textarea
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="Ask the AI for help..."
                  style={{
                    width: '100%',
                    height: '80px',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={askAI}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Thinking...' : 'Ask AI'}
                  </button>
                  <button
                    onClick={generateCode}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Generating...' : 'Generate Code'}
                  </button>
                  <button
                    onClick={executeTask}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Executing...' : 'Execute Task'}
                  </button>
                  <button
                    onClick={reviewCode}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Reviewing...' : 'Review Code'}
                  </button>
                  <button
                    onClick={debugError}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Debugging...' : 'Debug Error'}
                  </button>
                </div>

                {/* Multi-Language Tools */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={analyzeCode}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#06b6d4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Analyzing...' : '🔍 Analyze'}
                  </button>
                  <button
                    onClick={formatCode}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Formatting...' : '🎨 Format'}
                  </button>
                  <button
                    onClick={getSuggestions}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Thinking...' : '💡 Suggest'}
                  </button>
                  <select
                    onChange={(e) => e.target.value && convertCode(e.target.value)}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 12px',
                      background: aiLoading ? '#64748b' : '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>🔄 Convert to...</option>
                    {supportedLanguages.filter(lang => lang !== currentLanguage).map(lang => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enhanced AI Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={generateCodeMulti}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Generating...' : `Generate ${currentLanguage}`}
                  </button>
                  <button
                    onClick={reviewCodeMulti}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Reviewing...' : `Review ${currentLanguage}`}
                  </button>
                  <button
                    onClick={debugErrorMulti}
                    disabled={aiLoading}
                    style={{
                      padding: '8px 16px',
                      background: aiLoading ? '#64748b' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? 'Debugging...' : `Debug ${currentLanguage}`}
                  </button>
                </div>
              </div>
              {aiOutput && (
                <div style={{
                  marginTop: '16px',
                  background: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#cbd5e1',
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {aiOutput}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{
              marginTop: '24px',
              padding: '12px 16px',
              background: 'rgba(148, 163, 184, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              <strong>API Endpoint:</strong> <code style={{ color: '#cbd5e1' }}>{apiUrl}</code> •
              <strong> User:</strong> {user.username} ({user.role}) •
              <strong> Security:</strong> Enterprise-grade with audit logging
            </div>
          </main>
        </>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#f1f5f9' }}>Create New Project</h3>

            <form onSubmit={createProject}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                  Description (optional)
                </label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    height: '80px',
                    padding: '12px',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Language Detection Modal */}
      {showLanguageModal && detectedLanguage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f1f5f9' }}>🌍 Language Detected</h3>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#cbd5e1' }}>
                <strong>Language:</strong> {detectedLanguage.language.charAt(0).toUpperCase() + detectedLanguage.language.slice(1)}
              </p>
              {detectedLanguage.frameworks.length > 0 && (
                <p style={{ margin: '0 0 8px 0', color: '#cbd5e1' }}>
                  <strong>Frameworks:</strong> {detectedLanguage.frameworks.join(', ')}
                </p>
              )}
              <p style={{ margin: '0 0 8px 0', color: '#cbd5e1' }}>
                <strong>File Type:</strong> {detectedLanguage.extension || 'unknown'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setCurrentLanguage(detectedLanguage.language);
                  setFrameworks(detectedLanguage.frameworks);
                  setShowLanguageModal(false);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Apply Detection
              </button>
              <button
                onClick={() => setShowLanguageModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Keep Current
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
        padding: '24px',
        background: 'rgba(15, 23, 42, 0.5)',
        fontSize: '13px',
        color: '#64748b',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0 }}>
          © 2026 Zenvora Enterprise. Built with Next.js + Express.js • Enterprise Security & AI-Powered Development
        </p>
      </footer>
    </div>
  );
}'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function Home() {
  const [code, setCode] = useState("// Welcome to Zenvora IDE\nconsole.log('Hello World!');\n\n// Try running some JavaScript code...");
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const runCode = async () => {
    setLoading(true);
    setOutput('Executing code...');
    try {
      let data;
      if (window.electronAPI) {
        data = await window.electronAPI.runCode(code);
      } else {
        const response = await fetch(`${apiUrl}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        data = await response.json();
      }
      if (data.error) {
        setOutput(`❌ Error: ${data.error}`);
      } else {
        setOutput(`✅ Output:\n${data.result}`);
      }
    } catch (err) {
      setOutput(`❌ Error: ${err.message}`);
    }
    setLoading(false);
  };

  const askAI = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiOutput('Thinking...');
    try {
      let response;
      if (window.electronAPI) {
        response = await window.electronAPI.askAI(aiInput);
        setAiOutput(response);
      } else {
        const res = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2:1b',
            messages: [{ role: 'user', content: aiInput }],
            stream: false
          })
        });
        const data = await res.json();
        setAiOutput(data.message.content);
      }
    } catch (err) {
      setAiOutput(`Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const generateCode = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiOutput('Generating code...');
    try {
      let data;
      if (window.electronAPI) {
        data = { result: await window.electronAPI.generateCode(aiInput) };
      } else {
        const response = await fetch(`${apiUrl}/generate-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: aiInput })
        });
        data = await response.json();
      }
      if (data.error) {
        setAiOutput(`❌ Error: ${data.error}`);
      } else {
        setAiOutput(`✅ Generated Code:\n${data.result}`);
      }
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const executeTask = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiOutput('Executing task...');
    try {
      let data;
      if (window.electronAPI) {
        data = await window.electronAPI.executeTask(aiInput);
      } else {
        const response = await fetch(`${apiUrl}/execute-task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: aiInput })
        });
        data = await response.json();
      }
      if (data.error) {
        setAiOutput(`❌ Error: ${data.error}`);
      } else {
        let output = `✅ Task Completed:\n${data.output}\n\n`;
        if (data.intermediateSteps) {
          output += 'Steps taken:\n';
          data.intermediateSteps.forEach((step, i) => {
            output += `${i + 1}. ${step.action.tool}(${JSON.stringify(step.action.toolInput)})\n`;
            output += `   Result: ${step.observation}\n\n`;
          });
        }
        setAiOutput(output);
      }
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const reviewCode = async () => {
    if (!code.trim()) return;
    setAiLoading(true);
    setAiOutput('Reviewing code...');
    try {
      let result;
      if (window.electronAPI) {
        result = await window.electronAPI.reviewCode(code, 'javascript');
      } else {
        const response = await fetch(`${apiUrl}/review-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language: 'javascript' })
        });
        const data = await response.json();
        result = data.result;
      }
      setAiOutput(`🔍 Code Review:\n${result}`);
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const debugError = async () => {
    const errorMatch = output.match(/❌ Error: (.+)/);
    if (!errorMatch || !code.trim()) {
      setAiOutput('No error found to debug. Run code first to generate an error.');
      return;
    }
    const errorMsg = errorMatch[1];
    setAiLoading(true);
    setAiOutput('Debugging error...');
    try {
      let result;
      if (window.electronAPI) {
        result = await window.electronAPI.debugError(errorMsg, code);
      } else {
        const response = await fetch(`${apiUrl}/debug-error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: errorMsg, code })
        });
        const data = await response.json();
        result = data.result;
      }
      setAiOutput(`🐛 Debug Analysis:\n${result}`);
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        padding: '24px',
        backdropFilter: 'blur(10px)',
        background: 'rgba(15, 23, 42, 0.5)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#f1f5f9' }}>
            🚀 Zenvora IDE
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
            Hybrid Cloud AI Code Execution Environment
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
      }}>
        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: '#f1f5f9' }}>
            Code Editor
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Execute JavaScript code in real-time
          </p>
        </div>

        {/* Editor Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Code Editor Panel */}
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              background: '#0f172a',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#cbd5e1'
            }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>JavaScript Code</span>
            </div>
            
            <Editor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={setCode}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: '"Fira Code", "Monaco", monospace',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Output Panel */}
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              background: '#0f172a',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#cbd5e1'
            }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: output ? '#10b981' : '#64748b' }}></span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>
                {output ? 'Output' : 'Ready'}
              </span>
            </div>
            
            <pre style={{
              flex: 1,
              background: '#0f172a',
              color: '#cbd5e1',
              fontFamily: '"Fira Code", "Monaco", monospace',
              fontSize: '13px',
              padding: '16px',
              margin: 0,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {output || 'Run code to see output...'}
            </pre>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={runCode}
          disabled={loading}
          style={{
            background: loading ? '#64748b' : '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 200ms ease',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
            hover: { background: '#2563eb' }
          }}
          onMouseOver={(e) => !loading && (e.target.style.background = '#2563eb')}
          onMouseOut={(e) => !loading && (e.target.style.background = '#3b82f6')}
        >
          {loading ? 'Executing...' : '▶ Run Code'}
        </button>

        {/* AI Chat Panel */}
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: '#f1f5f9' }}>
            🤖 AI Assistant
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Ask questions or get code help from local AI
          </p>
          <div style={{ marginTop: '16px' }}>
            <textarea
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ask the AI for help..."
              style={{
                width: '100%',
                height: '80px',
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: '"Fira Code", monospace',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            <button
              onClick={askAI}
              disabled={aiLoading}
              style={{
                marginTop: '8px',
                marginRight: '8px',
                background: aiLoading ? '#64748b' : '#10b981',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.7 : 1
              }}
            >
              {aiLoading ? 'Thinking...' : 'Ask AI'}
            </button>            <button
              onClick={executeTask}
              disabled={aiLoading}
              style={{
                marginTop: '8px',
                marginRight: '8px',
                background: aiLoading ? '#64748b' : '#f59e0b',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.7 : 1
              }}
            >
              {aiLoading ? 'Executing...' : 'Execute Task'}
            </button>
            <button
              onClick={reviewCode}
              disabled={aiLoading}
              style={{
                marginTop: '8px',
                marginRight: '8px',
                background: aiLoading ? '#64748b' : '#10b981',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.7 : 1
              }}
            >
              {aiLoading ? 'Reviewing...' : 'Review Code'}
            </button>
            <button
              onClick={debugError}
              disabled={aiLoading}
              style={{
                marginTop: '8px',
                background: aiLoading ? '#64748b' : '#ef4444',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.7 : 1
              }}
            >
              {aiLoading ? 'Debugging...' : 'Debug Error'}
            </button>            <button
              onClick={generateCode}
              disabled={aiLoading}
              style={{
                marginTop: '8px',
                background: aiLoading ? '#64748b' : '#8b5cf6',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.7 : 1
              }}
            >
              {aiLoading ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
          {aiOutput && (
            <div style={{
              marginTop: '16px',
              background: '#1e293b',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              color: '#cbd5e1',
              fontFamily: '"Fira Code", monospace',
              fontSize: '13px',
              whiteSpace: 'pre-wrap'
            }}>
              {aiOutput}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{
          marginTop: '24px',
          padding: '12px 16px',
          background: 'rgba(148, 163, 184, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          <strong>API Endpoint:</strong> <code style={{ color: '#cbd5e1' }}>{apiUrl}</code>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
        padding: '24px',
        background: 'rgba(15, 23, 42, 0.5)',
        fontSize: '13px',
        color: '#64748b',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0 }}>
          © 2026 Zenvora. Built with Next.js + Express.js
        </p>
      </footer>
    </div>
  );
}