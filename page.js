import { useState } from 'react';

export default function Home() {
  const [code, setCode] = useState("console.log('Hello from Zenvora!');");
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const runCode = async () => {
    setLoading(true);
    setOutput('Loading...');
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