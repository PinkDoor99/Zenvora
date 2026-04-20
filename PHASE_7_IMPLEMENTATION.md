# Phase 7: Enterprise Integrations - Implementation Plan

## Overview
Phase 7 introduces GitHub/GitLab integrations and real-time collaborative editing - the foundation for enterprise adoption and £400k+ valuation.

**Timeline:** 8-10 weeks
**Team:** 2 full-stack developers
**Priority:** CRITICAL (foundation for all future phases)

---

## Module 1: GitHub Integration (Weeks 1-2)

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│               Zenvora Frontend                              │
│         "GitHub" Button → OAuth Flow                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           GitHub OAuth Handler                              │
│  1. User clicks "Connect GitHub"                            │
│  2. Redirected to GitHub auth                               │
│  3. Get access token & user info                            │
│  4. Store token securely in DB                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          GitHub Integration Handler                         │
│  - Fetch repos & branches                                   │
│  - Pull code from GitHub                                    │
│  - Create commits                                           │
│  - Create pull requests                                     │
│  - Update PRs                                               │
│  - Handle webhooks                                          │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: GitHub OAuth Setup
```javascript
// lib/githubIntegration.js

const axios = require('axios');

class GitHubIntegration {
  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
    this.redirectUri = process.env.GITHUB_REDIRECT_URI;
  }

  // Generate OAuth URL
  getAuthUrl(state) {
    return `https://github.com/login/oauth/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${this.redirectUri}&` +
      `scope=repo,user,workflow&` +
      `state=${state}`;
  }

  // Exchange code for token
  async exchangeCode(code) {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri
      },
      { headers: { Accept: 'application/json' } }
    );
    
    return response.data.access_token;
  }

  // Get user info
  async getUserInfo(token) {
    const response = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}

module.exports = new GitHubIntegration();
```

#### Step 2: Database Schema for Git Integrations
```javascript
// lib/database.js - Add to initTables()

// GitHub integrations table
CREATE TABLE IF NOT EXISTS github_integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  github_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at DATETIME,
  scope TEXT,
  connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

// GitHub repositories table
CREATE TABLE IF NOT EXISTS github_repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  repo_name TEXT NOT NULL,
  repo_full_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  default_branch TEXT,
  last_synced DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

// Git operations log (for audit)
CREATE TABLE IF NOT EXISTS git_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  operation TEXT,
  repo_name TEXT,
  details TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Step 3: API Endpoints for GitHub

```javascript
// server.js additions

// OAuth callback
app.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    const token = await github.exchangeCode(code);
    const userInfo = await github.getUserInfo(token);
    
    // Store in database
    await db.storeGitHubIntegration(
      req.user?.userId,
      userInfo.login,
      token
    );
    
    res.redirect('/dashboard?github_connected=true');
  } catch (error) {
    res.redirect('/dashboard?github_error=true');
  }
});

// Get repositories
app.get('/api/github/repos', auth.authenticate, async (req, res) => {
  try {
    const integration = await db.getGitHubIntegration(req.user.userId);
    if (!integration) {
      return res.status(404).json({ error: 'GitHub not connected' });
    }

    const repos = await github.getRepositories(integration.access_token);
    res.json({ repos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Pull code from GitHub
app.post('/api/github/pull', auth.authenticate, async (req, res) => {
  const { repo, branch } = req.body;
  
  try {
    const integration = await db.getGitHubIntegration(req.user.userId);
    const code = await github.getFileContent(
      integration.access_token,
      repo,
      branch
    );
    
    await db.logGitOperation(req.user.userId, 'PULL', repo, { branch });
    res.json({ code, branch });
  } catch (error) {
    res.status(500).json({ error: 'Failed to pull from GitHub' });
  }
});

// Create commit
app.post('/api/github/commit', auth.authenticate, async (req, res) => {
  const { repo, branch, message, files } = req.body;
  
  try {
    const integration = await db.getGitHubIntegration(req.user.userId);
    const commitSha = await github.createCommit(
      integration.access_token,
      repo,
      branch,
      message,
      files
    );
    
    await db.logGitOperation(req.user.userId, 'COMMIT', repo, 
      { message, fileCount: files.length });
    res.json({ commitSha, message: 'Commit created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create commit' });
  }
});

// Create Pull Request
app.post('/api/github/pr', auth.authenticate, async (req, res) => {
  const { repo, title, body, head, base } = req.body;
  
  try {
    const integration = await db.getGitHubIntegration(req.user.userId);
    const pr = await github.createPullRequest(
      integration.access_token,
      repo,
      { title, body, head, base }
    );
    
    await db.logGitOperation(req.user.userId, 'CREATE_PR', repo, 
      { title, prNumber: pr.number });
    res.json({ pr });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PR' });
  }
});
```

#### Step 4: Frontend Integration
```javascript
// app/page.js - Add GitHub section

// In state section
const [githubConnected, setGithubConnected] = useState(false);
const [githubRepos, setGithubRepos] = useState([]);
const [selectedRepo, setSelectedRepo] = useState(null);

// GitHub connection handler
const connectGitHub = () => {
  const state = Math.random().toString(36).substring(7);
  window.location.href = `${apiUrl}/github/oauth?state=${state}`;
};

// Fetch repositories
const fetchGitHubRepos = async () => {
  const token = localStorage.getItem('zenvora_token');
  const response = await fetch(`${apiUrl}/api/github/repos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  setGithubRepos(data.repos);
};

// Create PR from code
const createPullRequest = async () => {
  const prData = {
    repo: selectedRepo,
    title: `[Zenvora] Code improvement`,
    body: `Automated improvement from Zenvora IDE\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    head: 'zenvora-improvements',
    base: 'main'
  };
  
  // Send to backend
  const response = await fetch(`${apiUrl}/api/github/pr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('zenvora_token')}`
    },
    body: JSON.stringify(prData)
  });
  
  const result = await response.json();
  alert(`PR created: ${result.pr.html_url}`);
};

// UI Component
<div style={{ marginTop: '20px', padding: '16px', background: '#1e293b', borderRadius: '8px' }}>
  <h3>🐙 GitHub Integration</h3>
  
  {!githubConnected ? (
    <button onClick={connectGitHub} style={{
      padding: '8px 16px',
      background: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    }}>
      Connect GitHub
    </button>
  ) : (
    <div>
      <p>✅ GitHub Connected</p>
      <select onChange={(e) => setSelectedRepo(e.target.value)}>
        <option value="">Select Repository</option>
        {githubRepos.map(repo => (
          <option key={repo.id} value={repo.full_name}>
            {repo.name}
          </option>
        ))}
      </select>
      <button onClick={createPullRequest} style={{
        marginTop: '8px',
        padding: '8px 16px',
        background: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}>
        Create PR with Code
      </button>
    </div>
  )}
</div>
```

#### Step 5: Environment Variables
```bash
# .env
GITHUB_CLIENT_ID=your_github_app_id
GITHUB_CLIENT_SECRET=your_github_app_secret
GITHUB_REDIRECT_URI=https://yourdomain.com/github/callback
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

#### Step 6: GitHub App Setup
1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Fill in:
   - Application name: "Zenvora IDE"
   - Homepage URL: https://yourdomain.com
   - Authorization callback URL: https://yourdomain.com/github/callback
3. Copy Client ID and Client Secret to .env

---

## Module 2: Real-Time Collaborative Editing (Weeks 3-4)

### Architecture (Using WebSockets + CRDT)
```
Frontend - Monaco Editor Instance 1
    ↕ (WebSocket)
    │
    ├─→ Operational Transform Engine
    │   (Conflict resolution)
    │
Backend - Central Editor State
    │
    ├─→ CRDT Store
    │   (Eventual consistency)
    │
Frontend - Monaco Editor Instance 2
    ↕ (WebSocket)
```

### Implementation

#### Step 1: WebSocket Server Setup
```javascript
// lib/collaborativeEditor.js

const WebSocket = require('ws');
const { v4: uuid } = require('uuid');

class CollaborativeEditor {
  constructor() {
    this.sessions = new Map(); // sessionId → EditorSession
    this.clientConnections = new Map(); // clientId → WebSocket
  }

  // Create new collaborative session
  createSession(projectId) {
    const sessionId = uuid();
    const session = {
      id: sessionId,
      projectId,
      content: '',
      version: 0,
      clients: new Set(),
      history: []
    };
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  // Client joins session
  joinSession(sessionId, clientId, ws) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.clients.add(clientId);
    this.clientConnections.set(clientId, ws);

    // Send current state to new client
    ws.send(JSON.stringify({
      type: 'init',
      content: session.content,
      version: session.version,
      clients: Array.from(session.clients)
    }));

    // Notify other clients of new user
    this.broadcastToSession(sessionId, {
      type: 'user_joined',
      clientId,
      clients: Array.from(session.clients)
    }, clientId);
  }

  // Handle edit operation (Operational Transform)
  applyOperation(sessionId, clientId, operation) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Transform operation against history
    const transformedOp = this.transformOperation(
      operation,
      session.history
    );

    // Apply to content
    session.content = this.applyEdit(
      session.content,
      transformedOp.position,
      transformedOp.deletion,
      transformedOp.insertion
    );

    // Store in history
    session.history.push(transformedOp);
    session.version++;

    // Broadcast to all clients
    this.broadcastToSession(sessionId, {
      type: 'operation',
      operation: transformedOp,
      version: session.version,
      clientId
    });
  }

  // Operational Transform (OT algorithm)
  transformOperation(op, history) {
    let transformedOp = { ...op };

    for (const prevOp of history) {
      transformedOp = this.transform(transformedOp, prevOp);
    }

    return transformedOp;
  }

  transform(op1, op2) {
    // Handle position conflicts
    if (op1.position > op2.position) {
      op1.position += op2.insertion.length - (op2.deletion || '').length;
    }
    return op1;
  }

  applyEdit(content, position, deletion, insertion) {
    const before = content.substring(0, position);
    const after = content.substring(position + deletion.length);
    return before + insertion + after;
  }

  // Broadcast to all clients in session
  broadcastToSession(sessionId, message, excludeClientId = null) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const clientId of session.clients) {
      if (clientId === excludeClientId) continue;

      const ws = this.clientConnections.get(clientId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  // Presence awareness (cursor positions)
  updateCursor(sessionId, clientId, line, column) {
    this.broadcastToSession(sessionId, {
      type: 'cursor_update',
      clientId,
      position: { line, column }
    }, clientId);
  }
}

module.exports = new CollaborativeEditor();
```

#### Step 2: Express WebSocket Integration
```javascript
// server.js

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const collaborativeEditor = require('./lib/collaborativeEditor');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientId = req.url.split('/').pop();
  let currentSessionId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'join':
          currentSessionId = message.sessionId;
          collaborativeEditor.joinSession(
            message.sessionId,
            clientId,
            ws
          );
          break;

        case 'operation':
          collaborativeEditor.applyOperation(
            currentSessionId,
            clientId,
            message.operation
          );
          break;

        case 'cursor':
          collaborativeEditor.updateCursor(
            currentSessionId,
            clientId,
            message.line,
            message.column
          );
          break;

        case 'save':
          // Save to database
          db.saveCode(currentSessionId, collaborativeEditor.sessions.get(currentSessionId).content);
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  });

  ws.on('close', () => {
    // Clean up
    delete collaborativeEditor.clientConnections[clientId];
  });
});

server.listen(PORT, () => {
  console.log(`Server with WebSocket running on port ${PORT}`);
});
```

#### Step 3: Frontend WebSocket Client
```javascript
// lib/collaborativeEditorClient.js (frontend)

class CollaborativeEditorClient {
  constructor(editor, editorElement) {
    this.editor = editor;
    this.clientId = Math.random().toString(36).substring(7);
    this.ws = null;
    this.remoteOperations = [];
    this.localVersion = 0;
  }

  connect(sessionId, wsUrl) {
    this.ws = new WebSocket(`${wsUrl}/${this.clientId}`);

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        type: 'join',
        sessionId
      }));
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'init':
          this.editor.setValue(message.content);
          break;

        case 'operation':
          if (message.clientId !== this.clientId) {
            this.applyRemoteOperation(message.operation);
          }
          break;

        case 'cursor_update':
          if (message.clientId !== this.clientId) {
            this.showRemoteCursor(
              message.clientId,
              message.position
            );
          }
          break;
      }
    };

    this.setupLocalEditing();
  }

  setupLocalEditing() {
    let contentChanged = false;
    let lastEventTime = 0;

    this.editor.onDidChangeModelContent((event) => {
      const now = Date.now();

      // Debounce to batch operations
      if (now - lastEventTime < 100 && contentChanged) return;

      contentChanged = true;
      lastEventTime = now;

      const changes = event.changes[0];
      this.sendOperation({
        type: 'insert_delete',
        position: this.editor.getModel().getOffsetAt({
          lineNumber: changes.range.startLineNumber,
          column: changes.range.startColumn
        }),
        deletion: changes.rangeLength,
        insertion: changes.text
      });
    });

    // Track cursor position
    this.editor.onDidChangeCursorPosition((event) => {
      const position = event.position;
      this.ws.send(JSON.stringify({
        type: 'cursor',
        line: position.lineNumber,
        column: position.column
      }));
    });
  }

  sendOperation(operation) {
    this.ws.send(JSON.stringify({
      type: 'operation',
      operation
    }));
  }

  applyRemoteOperation(operation) {
    const model = this.editor.getModel();
    const content = model.getValue();
    
    const before = content.substring(0, operation.position);
    const after = content.substring(
      operation.position + operation.deletion
    );
    const newContent = before + operation.insertion + after;

    const startPos = model.getPositionAt(operation.position);
    const endPos = model.getPositionAt(
      operation.position + operation.deletion
    );

    model.applyEdits([{
      range: new monaco.Range(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column
      ),
      text: operation.insertion,
      forceMoveMarkers: true
    }]);
  }

  showRemoteCursor(clientId, position) {
    // Show other users' cursor positions with their color
    // This would integrate with Monaco editor decorations
  }

  save() {
    this.ws.send(JSON.stringify({ type: 'save' }));
  }
}
```

#### Step 4: Integration with Monaco Editor
```javascript
// app/page.js additions

// In state
const [collaborativeMode, setCollaborativeMode] = useState(false);
const [sessionId, setSessionId] = useState(null);
const [editor, setEditor] = useState(null);
const [collaborativeClient, setCollaborativeClient] = useState(null);

// Start collaborative session
const startCollaborativeSession = async () => {
  const token = localStorage.getItem('zenvora_token');
  const response = await fetch(`${apiUrl}/collab/create-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ projectId: currentProject?.id })
  });

  const data = await response.json();
  setSessionId(data.sessionId);

  // Initialize collaborative client
  const client = new CollaborativeEditorClient(editor);
  const wsUrl = `ws://${window.location.host}`;
  client.connect(data.sessionId, wsUrl);

  setCollaborativeClient(client);
  setCollaborativeMode(true);
};

// UI for collaboration
<div>
  {!collaborativeMode ? (
    <button onClick={startCollaborativeSession}>
      Start Collaboration
    </button>
  ) : (
    <div>
      ✅ Collaborative Mode Active
      <button onClick={() => collaborativeClient.save()}>
        Save
      </button>
    </div>
  )}
</div>
```

---

## Testing Checklist

- [ ] GitHub OAuth flow works end-to-end
- [ ] Can successfully pull code from GitHub
- [ ] Can create commits and push to GitHub
- [ ] Can create pull requests
- [ ] Webhook handling works
- [ ] Real-time editing syncs between 2+ clients
- [ ] Operational transform resolves conflicts correctly
- [ ] Cursor positions update in real-time
- [ ] No data loss during concurrent edits
- [ ] Session persistence works after client disconnect
- [ ] Performance acceptable with 5+ concurrent editors

---

## Success Metrics

| Metric | Target |
|--------|--------|
| GitHub integration adoption | 30% of users within 1 month |
| Average PR creation time | < 2 minutes (vs 15 min manually) |
| Concurrent editor sessions | Support 50+ simultaneous |
| Sync latency | <100ms |
| Data loss incidents | 0 |
| User satisfaction (NPS) | >50 |

---

## Next Phases

- **Week 5:** GitLab integration (similar to GitHub)
- **Week 6:** Real-time code review features
- **Week 7:** Session recording/playback
- **Week 8:** Advanced collaboration (voice, video)

