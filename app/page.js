'use client';

import { useState } from 'react';

export default function Home() {
  const [code, setCode] = useState("console.log('Hello from Zenvora!');");
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

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
    setOutput('Loading...');
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
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setAiOutput(`❌ Error: ${err.message}`);
    }
    setAiLoading(false);
  };

  const clearOutput = () => {
    setOutput('');
    setExecutionTime(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', gap: '10px', padding: '10px', fontFamily: 'system-ui' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h2>Code Editor</h2>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{
            flex: 1,
            fontFamily: 'monospace',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          placeholder="Write JavaScript code..."
        />
        <button
          onClick={runCode}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginTop: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Running...' : 'Run Code'}
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          API: {apiUrl}
        </p>
      </div>
      <div style={{
        flex: 1,
        backgroundColor: '#f5f5f5',
        overflow: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px'
      }}>
        <h2>Output</h2>
        <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {output}
        </pre>
      </div>
    </div>
  );
}