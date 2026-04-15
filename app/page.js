'use client';

import { useState } from 'react';
import Navigation from './components/Navigation';
import { Button, Card, Input, Badge, AzureTheme } from './components/index';

export default function Home() {
  const [code, setCode] = useState("// Welcome to Zenvora IDE\nconsole.log('Hello World!');\n\n// Try running some JavaScript code...");
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const runCode = async () => {
    setLoading(true);
    setOutput('Executing code...');
    setExecutionTime(null);
    
    const startTime = Date.now();
    try {
      const response = await fetch(`${apiUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const clearOutput = () => {
    setOutput('');
    setExecutionTime(null);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#FFFFFF',
      color: AzureTheme.colors.foreground,
      fontFamily: AzureTheme.fontFamily
    }}>
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '100%'
      }}>
        {/* Header Section */}
        <div style={{
          padding: `${AzureTheme.spacing.xl} ${AzureTheme.spacing.xl}`,
          borderBottom: `1px solid ${AzureTheme.colors.border}`,
          background: AzureTheme.colors.backgroundSecondary
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '28px', 
                  fontWeight: '600', 
                  color: AzureTheme.colors.foreground 
                }}>
                  Code Editor
                </h1>
                <p style={{ 
                  fontSize: '14px', 
                  color: AzureTheme.colors.foregroundSecondary, 
                  margin: 0 
                }}>
                  Execute JavaScript code in real-time with Zenvora IDE
                </p>
              </div>
              <Badge variant="primary">Ready</Badge>
            </div>
          </div>
        </div>

        {/* Editor Container */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          padding: AzureTheme.spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: AzureTheme.spacing.xl,
            flex: 1,
            minHeight: 0,
            maxWidth: '100%'
          }}>
            {/* Code Editor Panel */}
            <Card variant="elevated" padding={false}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <div style={{
                  padding: AzureTheme.spacing.md,
                  borderBottom: `1px solid ${AzureTheme.colors.border}`,
                  background: AzureTheme.colors.backgroundSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: AzureTheme.spacing.sm
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: AzureTheme.colors.primary
                  }}></div>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>
                    JavaScript Code
                  </span>
                </div>

                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  style={{
                    flex: 1,
                    background: AzureTheme.colors.background,
                    color: AzureTheme.colors.foreground,
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '13px',
                    padding: AzureTheme.spacing.md,
                    outline: 'none',
                    border: 'none',
                    resize: 'none',
                    lineHeight: '1.5'
                  }}
                  placeholder="// Write JavaScript code here..."
                  spellCheck="false"
                />
              </div>
            </Card>

            {/* Output Panel */}
            <Card variant="elevated" padding={false}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <div style={{
                  padding: AzureTheme.spacing.md,
                  borderBottom: `1px solid ${AzureTheme.colors.border}`,
                  background: AzureTheme.colors.backgroundSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: AzureTheme.spacing.sm }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: output ? AzureTheme.colors.success : AzureTheme.colors.foregroundTertiary
                    }}></div>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>
                      {output ? 'Output' : 'Ready'}
                    </span>
                  </div>
                  {output && (
                    <button
                      onClick={clearOutput}
                      style={{
                        background: 'transparent',
                        color: AzureTheme.colors.primary,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <pre style={{
                  flex: 1,
                  background: AzureTheme.colors.background,
                  color: AzureTheme.colors.foreground,
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '12px',
                  padding: AzureTheme.spacing.md,
                  margin: 0,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  lineHeight: '1.5'
                }}>
                  {output || '// Output will appear here...'}
                </pre>
              </div>
            </Card>
          </div>

          {/* Controls Section */}
          <div style={{
            marginTop: AzureTheme.spacing.xl,
            display: 'flex',
            gap: AzureTheme.spacing.lg,
            alignItems: 'center'
          }}>
            <Button 
              onClick={runCode}
              disabled={loading}
              loading={loading}
              size="large"
            >
              ▶ {loading ? 'Executing...' : 'Run Code'}
            </Button>

            {executionTime !== null && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: AzureTheme.spacing.sm,
                padding: `${AzureTheme.spacing.sm} ${AzureTheme.spacing.md}`,
                background: AzureTheme.colors.backgroundSecondary,
                borderRadius: AzureTheme.radii.md,
                border: `1px solid ${AzureTheme.colors.border}`
              }}>
                <span style={{ fontSize: '13px', color: AzureTheme.colors.foregroundSecondary }}>
                  Execution Time:
                </span>
                <Badge variant="info" size="small">
                  {executionTime}ms
                </Badge>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: AzureTheme.spacing.sm,
              marginLeft: 'auto',
              padding: `${AzureTheme.spacing.sm} ${AzureTheme.spacing.md}`,
              background: AzureTheme.colors.backgroundSecondary,
              borderRadius: AzureTheme.radii.md,
              border: `1px solid ${AzureTheme.colors.border}`,
              fontSize: '12px',
              color: AzureTheme.colors.foregroundSecondary
            }}>
              <span>API:</span>
              <code style={{ color: AzureTheme.colors.foreground, fontFamily: 'monospace' }}>
                {apiUrl.replace('http://', '').replace('https://', '')}
              </code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

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