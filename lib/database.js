const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    this.db = new sqlite3.Database('./zenvora.db', (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.initTables();
      }
    });
  }

  initTables() {
    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // Sessions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Projects table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        owner_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users (id)
      )
    `);

    // Project members table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        user_id INTEGER,
        role TEXT DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(project_id, user_id)
      )
    `);

    // Audit logs table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Code executions table (for audit)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS code_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        project_id INTEGER,
        code TEXT NOT NULL,
        result TEXT,
        execution_time INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (project_id) REFERENCES projects (id)
      )
    `);

    console.log('Database tables initialized');
  }

  // User methods
  async createUser(username, email, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username, email });
        }
      );
    });
  }

  async authenticateUser(usernameOrEmail, password) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
        [usernameOrEmail, usernameOrEmail],
        async (err, user) => {
          if (err) reject(err);
          else if (!user) resolve(null);
          else {
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (isValid) {
              // Update last login
              this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
              resolve(user);
            } else {
              resolve(null);
            }
          }
        }
      );
    });
  }

  // Session methods
  async createSession(userId, token, expiresAt) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getSessionByToken(token) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT s.*, u.username, u.email, u.role
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1`,
        [token],
        (err, session) => {
          if (err) reject(err);
          else resolve(session);
        }
      );
    });
  }

  async deleteSession(token) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM sessions WHERE token = ?', [token], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Audit logging
  async logAudit(userId, action, resourceType, resourceId, details, req) {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || 'unknown';
    const userAgent = req?.get('User-Agent') || 'unknown';

    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, action, resourceType, resourceId, details, ipAddress, userAgent],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // Project methods
  async createProject(name, description, ownerId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
        [name, description, ownerId],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, description, ownerId });
        }
      );
    });
  }

  async getUserProjects(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT p.* FROM projects p
         JOIN project_members pm ON p.id = pm.project_id
         WHERE pm.user_id = ?`,
        [userId],
        (err, projects) => {
          if (err) reject(err);
          else resolve(projects);
        }
      );
    });
  }

  // Project members methods
  async addProjectMember(projectId, userId, role = 'member') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, userId, role],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // Admin methods
  async getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id, username, email, role, created_at, last_login, is_active FROM users ORDER BY created_at DESC',
        [],
        (err, users) => {
          if (err) reject(err);
          else resolve(users);
        }
      );
    });
  }

  async getAuditLogs(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT al.*, u.username
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.timestamp DESC
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, logs) => {
          if (err) reject(err);
          else resolve(logs);
        }
      );
    });
  }
}

module.exports = new Database();