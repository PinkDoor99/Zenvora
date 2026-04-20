require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { VM } = require('vm2');
const path = require('path');

// Import our modules
const indexer = require('./lib/codebaseIndexer');
const agent = require('./lib/agent');
const hybridAI = require('./lib/hybridAI');
const db = require('./lib/database');
const auth = require('./lib/auth');
const languageDetector = require('./lib/languageDetector');
const codeQualityTools = require('./lib/codeQualityTools');
const { languageCache, analysisCache, projectCache } = require('./lib/cache');
const { BatchProcessor } = require('./lib/batchProcessor');
const { monitor, profiler } = require('./lib/performanceMonitor');
const { DatabaseOptimizer, QueryCache } = require('./lib/databaseOptimizer');

// Simple hash function for cache keys
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    h = ((h << 5) - h) + char;
    h = h & h; // Convert to 32bit integer
  }
  return 'h' + Math.abs(h).toString(36);
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.FRONTEND_URL || null
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize hybrid AI
hybridAI.initCloud(process.env.OPENAI_API_KEY);

// Public routes (no authentication required)
app.get('/', (req, res) => res.json({
  status: 'Zenvora Enterprise API running',
  version: '4.0.0',
  features: ['AI-Powered IDE', 'Enterprise Security', 'Team Collaboration']
}));

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
}));

// Authentication routes
app.post('/auth/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await db.createUser(username, email, password);
    const token = auth.generateToken(user);

    // Create session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await db.createSession(user.id, token, expiresAt);

    // Audit log
    await db.logAudit(user.id, 'USER_REGISTER', 'user', user.id, 'User account created', req);

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
      expiresAt
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

app.post('/auth/login', authLimiter, async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/email and password are required' });
  }

  try {
    const user = await db.authenticateUser(usernameOrEmail, password);

    if (!user) {
      // Audit log failed login
      await db.logAudit(null, 'LOGIN_FAILED', 'auth', null, `Failed login attempt for: ${usernameOrEmail}`, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = auth.generateToken(user);

    // Create session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.createSession(user.id, token, expiresAt);

    // Audit log successful login
    await db.logAudit(user.id, 'USER_LOGIN', 'auth', user.id, 'User logged in', req);

    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token,
      expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/auth/logout', auth.authenticate, async (req, res) => {
  try {
    await db.deleteSession(req.headers.authorization.split(' ')[1]);
    await db.logAudit(req.user.userId, 'USER_LOGOUT', 'auth', req.user.userId, 'User logged out', req);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/auth/me', auth.authenticate, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Protected routes (authentication required)
app.post('/execute', auth.optionalAuth, async (req, res) => {
  const { code, projectId } = req.body;
  const startTime = Date.now();

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    let output = '';
    const vm = new VM({
      timeout: 5000, // 5 second timeout for security
      sandbox: {
        console: {
          log: (...args) => output += args.join(' ') + '\n',
          error: (...args) => output += 'Error: ' + args.join(' ') + '\n',
          warn: (...args) => output += 'Warning: ' + args.join(' ') + '\n'
        }
      }
    });
    vm.run(code);

    const executionTime = Date.now() - startTime;
    const result = output.trim() || 'Code executed successfully (no output)';

    // Log execution if user is authenticated
    if (req.user) {
      await db.logCodeExecution(req.user.userId, projectId, code, result, executionTime);
      await db.logAudit(req.user.userId, 'CODE_EXECUTE', 'execution', null, `Executed code (${executionTime}ms)`, req);
    }

    res.json({ result, executionTime });
  } catch (e) {
    const executionTime = Date.now() - startTime;

    if (req.user) {
      await db.logCodeExecution(req.user.userId, projectId, code, `Error: ${e.message}`, executionTime);
      await db.logAudit(req.user.userId, 'CODE_EXECUTE_ERROR', 'execution', null, `Execution error: ${e.message}`, req);
    }

    res.status(400).json({ error: e.message, executionTime });
  }
});

app.post('/generate-code', auth.optionalAuth, async (req, res) => {
  const { prompt, projectId } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    // Search for relevant context
    const contextResults = await indexer.search(prompt, 3);
    const context = contextResults.map(r => `File: ${r.file}\n${r.content}`).join('\n\n');

    // Call hybrid AI
    const result = await hybridAI.generateCode(prompt, context);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'CODE_GENERATE', 'generation', null, `Generated code for: ${prompt.substring(0, 100)}...`, req);
    }

    res.json({ result, contextUsed: contextResults.length > 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/execute-task', auth.optionalAuth, async (req, res) => {
  const { task, projectId } = req.body;

  if (!task) {
    return res.status(400).json({ error: 'No task provided' });
  }

  try {
    const result = await agent.executeTask(task);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'TASK_EXECUTE', 'task', null, `Executed task: ${task.substring(0, 100)}...`, req);
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/review-code', auth.optionalAuth, async (req, res) => {
  const { code, language, projectId } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const review = await hybridAI.reviewCode(code, language || 'javascript');

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'CODE_REVIEW', 'review', null, `Reviewed ${language} code (${code.length} chars)`, req);
    }

    res.json({ result: review });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/debug-error', auth.optionalAuth, async (req, res) => {
  const { error, code, projectId } = req.body;

  if (!error || !code) {
    return res.status(400).json({ error: 'Error and code are required' });
  }

  try {
    const analysis = await hybridAI.debugError(error, code);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'DEBUG_ERROR', 'debug', null, `Debugged error: ${error.substring(0, 100)}...`, req);
    }

    res.json({ result: analysis });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Project management routes
app.post('/projects', auth.authenticate, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const project = await db.createProject(name, description, req.user.userId);

    // Add creator as project member with admin role
    await db.addProjectMember(project.id, req.user.userId, 'admin');

    await db.logAudit(req.user.userId, 'PROJECT_CREATE', 'project', project.id, `Created project: ${name}`, req);

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/projects', auth.authenticate, async (req, res) => {
  try {
    const projects = await db.getUserProjects(req.user.userId);
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Admin routes
app.get('/admin/users', auth.authenticate, auth.requireAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.get('/admin/audit-logs', auth.authenticate, auth.requireAdmin, async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  try {
    const logs = await db.getAuditLogs(limit, offset);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

// ===== PHASE 5: MULTI-LANGUAGE SUPPORT ENDPOINTS =====

// Language detection endpoint
app.post('/detect-language', auth.optionalAuth, async (req, res) => {
  const { code, filePath } = req.body;

  if (!code && !filePath) {
    return res.status(400).json({ error: 'Either code or filePath is required' });
  }

  try {
    let content = code;
    if (filePath && !code) {
      // Read file content if only filePath provided
      const fs = require('fs').promises;
      content = await fs.readFile(filePath, 'utf8');
    }

    // Check cache first
    const cacheKey = `detect_${hash(content + (filePath || ''))}`;
    let detection = languageCache.get(cacheKey);

    if (!detection) {
      detection = languageDetector.detect(filePath || '', content);
      // Cache the result (1 hour TTL)
      languageCache.set(cacheKey, detection, 3600000);
    }

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'LANGUAGE_DETECTION', 'ai', null, `Detected ${detection.language} for ${filePath || 'code snippet'}`, req);
    }

    res.json({ ...detection, cached: languageCache.has(cacheKey) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect language' });
  }
});

// Enhanced code generation with language support
app.post('/generate-code-multi', auth.optionalAuth, async (req, res) => {
  const { prompt, context, language, frameworks } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const generatedCode = await hybridAI.generateCode(prompt, context, language, frameworks);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'CODE_GENERATION', 'ai', null, `Generated ${language || 'code'} using prompt: ${prompt.substring(0, 100)}...`, req);
    }

    res.json({ code: generatedCode, language: language || 'javascript' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// Enhanced code review with language support
app.post('/review-code-multi', auth.optionalAuth, async (req, res) => {
  const { code, language, frameworks } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const review = await hybridAI.reviewCode(code, language, frameworks);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'CODE_REVIEW', 'ai', null, `Reviewed ${language || 'code'} (${code.length} chars)`, req);
    }

    res.json({ review, language: language || 'javascript' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to review code' });
  }
});

// Enhanced error debugging with language support
app.post('/debug-error-multi', auth.optionalAuth, async (req, res) => {
  const { error, code, language, frameworks } = req.body;

  if (!error || !code) {
    return res.status(400).json({ error: 'Both error and code are required' });
  }

  try {
    const debugInfo = await hybridAI.debugError(error, code, language, frameworks);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'ERROR_DEBUG', 'ai', null, `Debugged ${language || 'code'} error: ${error.substring(0, 100)}...`, req);
    }

    res.json({ debug: debugInfo, language: language || 'javascript' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to debug error' });
  }
});

// Code analysis endpoint (linting, static analysis)
app.post('/analyze-code', auth.optionalAuth, async (req, res) => {
  const { code, language, filePath } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const analysis = await codeQualityTools.analyzeCode(code, language, filePath);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'CODE_ANALYSIS', 'tools', null, `Analyzed ${language || 'code'} (${code.length} chars)`, req);
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze code' });
  }
});

// Code formatting endpoint
app.post('/format-code', auth.optionalAuth, async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const formatted = await codeQualityTools.formatCode(code, language);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'CODE_FORMAT', 'tools', null, `Formatted ${language || 'code'} (${code.length} chars)`, req);
    }

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to format code' });
  }
});

// Get available tools for a language
app.get('/tools/:language', auth.optionalAuth, async (req, res) => {
  const { language } = req.params;

  try {
    const tools = await codeQualityTools.getAvailableTools(language);
    const languageInfo = languageDetector.getLanguageInfo(language);

    res.json({
      language,
      languageInfo,
      availableTools: tools
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tools information' });
  }
});

// Get supported languages
app.get('/languages', auth.optionalAuth, (req, res) => {
  const supportedLanguages = languageDetector.getSupportedLanguages ? Object.keys(languageDetector.extensionMap || {}) : ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby'];

  res.json({
    supportedLanguages,
    languageDetails: supportedLanguages.map(lang => ({
      language: lang,
      info: languageDetector.getLanguageInfo(lang)
    }))
  });
});

// Code suggestions endpoint
app.post('/suggest-improvements', auth.optionalAuth, async (req, res) => {
  const { code, language, frameworks, context } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const suggestions = await hybridAI.getSuggestions(code, language, frameworks, context);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'CODE_SUGGESTIONS', 'ai', null, `Got suggestions for ${language || 'code'} (${code.length} chars)`, req);
    }

    res.json({ suggestions, language: language || 'javascript' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Cross-language conversion endpoint
app.post('/convert-code', auth.optionalAuth, async (req, res) => {
  const { code, fromLanguage, toLanguage, frameworks } = req.body;

  if (!code || !fromLanguage || !toLanguage) {
    return res.status(400).json({ error: 'Code, fromLanguage, and toLanguage are required' });
  }

  try {
    const convertedCode = await hybridAI.convertCode(code, fromLanguage, toLanguage, frameworks);

    // Audit log
    if (req.user) {
      await db.logAudit(req.user.userId, 'CODE_CONVERSION', 'ai', null, `Converted ${fromLanguage} to ${toLanguage} (${code.length} chars)`, req);
    }

    res.json({ convertedCode, fromLanguage, toLanguage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to convert code' });
  }
});

// ===== PHASE 6: PERFORMANCE MONITORING & OPTIMIZATION ENDPOINTS =====

// Performance endpoint - Get monitor statistics
app.get('/perf/monitor', auth.authenticate, auth.requireAdmin, (req, res) => {
  res.json(monitor.report);
});

// Cache statistics
app.get('/perf/cache', auth.authenticate, auth.requireAdmin, (req, res) => {
  res.json({
    languageCache: languageCache.getStats(),
    analysisCache: analysisCache.getStats(),
    projectCache: projectCache.getStats()
  });
});

// Profile statistics
app.get('/perf/profile', auth.authenticate, auth.requireAdmin, (req, res) => {
  res.json(profiler.getAllStats());
});

// Database optimization endpoints
app.post('/perf/db/optimize', auth.authenticate, auth.requireAdmin, (req, res) => {
  const indexResult = dbOptimizer.createIndexes();
  const analyzeResult = dbOptimizer.analyzeTables();
  const vacuumResult = dbOptimizer.vacuum();

  res.json({
    indexes: indexResult,
    analyze: analyzeResult,
    vacuum: vacuumResult,
    stats: dbOptimizer.getStats()
  });
});

app.get('/perf/db/stats', auth.authenticate, auth.requireAdmin, (req, res) => {
  const result = dbOptimizer.getStats();
  res.json(result);
});

app.get('/perf/db/slow-queries', auth.authenticate, auth.requireAdmin, (req, res) => {
  const result = dbOptimizer.findSlowQueries();
  res.json(result);
});

app.get('/perf/db/suggestions', auth.authenticate, auth.requireAdmin, (req, res) => {
  const result =dbOptimizer.suggestIndexes();
  res.json(result);
});

// Batch processing endpoint - analyze multiple files
app.post('/perf/batch-analyze', auth.optionalAuth, async (req, res) => {
  const { files } = req.body; // Array of { code, language }

  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Files array is required' });
  }

  try {
    const results = await batchProcessor.processBatch(
      files,
      async (file) => {
        const detection = languageDetector.detect(file.filePath || '', file.code);
        return {
          filePath: file.filePath || `file_${Math.random()}`,
          language: detection.language,
          frameworks: detection.frameworks
        };
      }
    );

    if (req.user) {
      await db.logAudit(req.user.userId, 'BATCH_ANALYSIS', 'analysis', null, `Analyzed ${files.length} files in batch`, req);
    }

    res.json({
      totalFiles: files.length,
      analyzed: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process batch' });
  }
});

// Memory snapshot for debugging
app.post('/perf/memory-snapshot', auth.authenticate, auth.requireAdmin, (req, res) => {
  const { label } = req.body;
  monitor.snapshotMemory(label || `snapshot_${Date.now()}`);
  res.json(monitor.getMemoryUsage());
});

// Batch language detection with caching
app.post('/perf/batch-detect', auth.optionalAuth, async (req, res) => {
  const { codes } = req.body;

  if (!Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({ error: 'Codes array is required' });
  }

  try {
    const results = codes.map((item, index) => {
      // Handle both string and object formats
      const code = typeof item === 'string' ? item : item.code;
      if (!code) return null;

      const cacheKey = `detect_${hash(code)}`;

      // Check cache first
      let result = languageCache.get(cacheKey);

      if (!result) {
        result = languageDetector.detect(item.filePath || '', code);
        // Cache the result
        languageCache.set(cacheKey, result);
      }

      return {
        index,
        ...result,
        cached: languageCache.has(cacheKey)
      };
    }).filter(r => r !== null);

    res.json({
      total: codes.length,
      processed: results.length,
      results,
      cacheInfo: languageCache.getStats()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect languages' });
  }
});

// Compact utility function for hashing
function hash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Audit log errors
  if (req.user) {
    db.logAudit(req.user.userId, 'ERROR_OCCURRED', 'system', null, `Error: ${err.message}`, req).catch(console.error);
  }

  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Zenvora Enterprise API running on port ${PORT}`);
  console.log(`🔒 Security: Helmet, Rate Limiting, CORS enabled`);
  console.log(`💾 Database: SQLite initialized`);
  console.log(`🔐 Authentication: JWT-based with session management`);
  console.log(`📊 Audit Logging: Enabled`);
  console.log(`👥 Team Collaboration: Ready`);
  console.log(`🌍 Multi-Language Support: Enabled (10+ languages)`);
  console.log(`🛠️  Code Quality Tools: Integrated`);
  console.log(`⚡ Performance Optimization: Caching, Batch Processing, DB Optimization`);
  console.log(`📈 Performance Monitoring: Real-time metrics & profiling`);
  console.log(`🤖 AI: Hybrid Local/Cloud with language specialization`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Index codebase on startup
  try {
    await indexer.indexDirectory(__dirname);
    console.log('📚 Codebase indexed successfully');
  } catch (error) {
    console.error('❌ Error indexing codebase:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});
