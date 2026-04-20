/**
 * Database optimization utilities
 */

class DatabaseOptimizer {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create indexes for better query performance
   */
  createIndexes() {
    try {
      // User indexes
      this.db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at)');

      // Session indexes
      this.db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)');

      // Project indexes
      this.db.run('CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at)');

      // Project members indexes
      this.db.run('CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id)');

      // Audit logs indexes
      this.db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id)');

      // Code execution indexes
      this.db.run('CREATE INDEX IF NOT EXISTS idx_code_exec_user_id ON code_executions(user_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_code_exec_project_id ON code_executions(project_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_code_exec_timestamp ON code_executions(timestamp)');

      return { success: true, message: 'Indexes created successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze table to update statistics
   */
  analyzeTables() {
    try {
      this.db.run('ANALYZE');
      return { success: true, message: 'Database analyzed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Vacuum database to reclaim space
   */
  vacuum() {
    try {
      this.db.run('VACUUM');
      return { success: true, message: 'Database vacuumed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get query execution plan
   */
  explainQuery(query, params = []) {
    try {
      const stmt = this.db.prepare(`EXPLAIN QUERY PLAN ${query}`);
      const plan = stmt.all(...params);
      return { success: true, plan };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get database statistics
   */
  getStats() {
    try {
      const result = {
        tables: [],
        indexes: this.db.prepare('SELECT name, tbl_name FROM sqlite_master WHERE type="index"').all(),
        diskUsage: null
      };

      // Get table statistics
      const tables = this.db.prepare(
        'SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"'
      ).all();

      for (const table of tables) {
        const tableInfo = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        result.tables.push({
          name: table.name,
          rowCount: tableInfo.count
        });
      }

      // Rough disk usage estimation
      const totalRows = result.tables.reduce((sum, t) => sum + t.rowCount, 0);
      result.diskUsage = {
        tables: result.tables.length,
        totalRows,
        estimatedSizeKB: (totalRows * 0.5).toFixed(2)
      };

      return { success: true, stats: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Find slow queries
   */
  findSlowQueries() {
    try {
      const result = this.db.prepare(
        'SELECT * FROM audit_logs WHERE execution_time_ms > 100 ORDER BY execution_time_ms DESC LIMIT 10'
      ).all();

      return { success: true, queries: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Optimize query by finding missing indexes
   */
  suggestIndexes() {
    try {
      // Check for columns that are frequently filtered on
      const suggestions = [];

      // Detect common WHERE clause columns
      const auditLogs = this.db.prepare(
        'SELECT COUNT(*) as count FROM audit_logs WHERE user_id IS NOT NULL'
      ).get();

      if (auditLogs.count > 1000) {
        suggestions.push({
          table: 'audit_logs',
          column: 'user_id',
          reason: 'Frequently used in WHERE clauses'
        });
      }

      return { success: true, suggestions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection pool statistics
   */
  getConnectionStats() {
    return {
      openConnections: 1, // SQLite is single-threaded
      queryQueueLength: 0,
      avgQueryTime: 0
    };
  }
}

/**
 * Query cache for frequently run queries
 */
class QueryCache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Get cached query result
   */
  get(query, params) {
    const key = this.generateKey(query, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Cache query result
   */
  set(query, params, result, ttl = this.ttl) {
    const key = this.generateKey(query, params);

    this.cache.set(key, {
      result,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    });
  }

  /**
   * Generate cache key
   */
  generateKey(query, params) {
    return `${query}:${JSON.stringify(params || [])}`;
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear specific query cache
   */
  clearQuery(query) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(query)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  getSize() {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      ttl: this.ttl,
      entries: Array.from(this.cache.keys()).map((key, index) => ({
        index,
        key: key.substring(0, 50) + (key.length > 50 ? '...' : '')
      }))
    };
  }
}

module.exports = {
  DatabaseOptimizer,
  QueryCache
};
