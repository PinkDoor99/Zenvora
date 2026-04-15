'use client';

import { useState } from 'react';

export default function Home() {
  const [code, setCode] = useState("// Welcome to Zenvora IDE\nconsole.log('Hello World!');\n\n// Try running some JavaScript code...");
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const runCode = async () => {
    setLoading(true);
    setOutput('Executing code...');
    try {
      const response = await fetch(`${apiUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    }
    setLoading(false);
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
            Professional Code Execution Environment
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
            
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{
                flex: 1,
                background: '#0f172a',
                color: '#e2e8f0',
                fontFamily: '"Fira Code", "Monaco", monospace',
                fontSize: '13px',
                padding: '16px',
                outline: 'none',
                border: 'none',
                resize: 'none'
              }}
              placeholder="Write JavaScript code..."
              spellCheck="false"
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