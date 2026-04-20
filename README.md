# Zenvora Enterprise: Hybrid Cloud AI IDE

A comprehensive, enterprise-grade AI-powered code editor with autonomous development capabilities, secure authentication, and team collaboration features.

## 🚀 Features

### Core IDE
- **Monaco Editor**: Professional code editing with syntax highlighting and IntelliSense
- **Secure Execution**: VM2 sandboxed JavaScript runtime with timeout protection
- **Multi-Platform**: Web application and Electron desktop app

### AI Capabilities
- **Local AI**: Ollama integration with Llama 3.2 model (privacy-focused, offline)
- **Hybrid AI**: Optional cloud AI (OpenAI GPT-4) with automatic fallback
- **Context-Aware Generation**: Multi-file codebase understanding for intelligent code suggestions
- **Autonomous Agent**: AI agents that execute complex development tasks
- **Code Review**: Automated security, performance, and quality analysis
- **Debug Assistant**: AI-powered error analysis and fix recommendations
- **Multi-Language Support**: 10+ programming languages with specialized AI prompts
- **Language Detection**: Automatic language and framework detection
- **Code Quality Tools**: Integrated linting, formatting, and static analysis

### Enterprise Features
- **User Authentication**: JWT-based secure login/registration system
- **Role-Based Access Control**: Admin and user roles with different permissions
- **Project Management**: Create and manage development projects
- **Audit Logging**: Comprehensive logging of all user actions for compliance
- **Session Management**: Secure session handling with automatic expiration
- **Rate Limiting**: Protection against abuse with configurable limits
- **Security Headers**: Helmet.js protection against common web vulnerabilities

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web/Desktop   │    │   Enterprise    │    │       AI        │
│     Client      │◄──►│     API         │◄──►│  Local/Cloud    │
│                 │    │   Express.js    │    │   Ollama/GPT    │
│                 │    │   + SQLite       │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Authentication │    │   Audit Logs    │    │ Vector Store    │
│   JWT + bcrypt   │    │   Compliance    │    │ Codebase Index  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- Ollama (for local AI)
- SQLite3 (automatically installed)

### Quick Start
```bash
# Install dependencies
npm install

# Install Ollama and model
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:1b
ollama serve

# Start development
npm run dev
```

### Environment Variables
```bash
# Optional: Enable cloud AI
OPENAI_API_KEY=your_key_here

# Optional: Configure JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Optional: API settings
PORT=5000
NODE_ENV=development
```

## 🎯 Usage

### Authentication
1. **Register**: Create a new account with username, email, and password
2. **Login**: Authenticate with username/email and password
3. **Sessions**: Automatic JWT token management with secure storage

### Project Management
- **Create Projects**: Start new development projects with descriptions
- **Switch Projects**: Select active project for code execution and AI context
- **Team Collaboration**: Foundation for multi-user project access

### Code Execution
1. Write JavaScript in the editor
2. Select a project (optional)
3. Click "Run Code" to execute safely
4. View results with execution time

### AI Features
- **Ask AI**: General coding questions (local Ollama)
- **Generate Code**: Context-aware code generation
- **Execute Task**: Autonomous task completion
- **Review Code**: Automated code analysis
- **Debug Error**: AI-assisted debugging

### Admin Panel (Admin Users Only)
- **User Management**: View all users, roles, and activity
- **Audit Logs**: Monitor all system activity for compliance
- **System Overview**: Dashboard for enterprise monitoring

### Multi-Language Support
Zenvora Enterprise supports 10+ programming languages with specialized AI assistance:

#### Supported Languages
- **JavaScript/TypeScript**: ES6+, React, Vue, Angular, Node.js, Express
- **Python**: Django, Flask, FastAPI, data science libraries
- **Java**: Spring Boot, Hibernate, Maven, Gradle
- **C++**: Qt, Boost, OpenCV, modern C++ standards
- **C#**: .NET, ASP.NET, Entity Framework
- **Go**: Gin, Echo, Fiber frameworks
- **Rust**: Tokio, Rocket, Actix
- **PHP**: Laravel, Symfony, PSR standards
- **Ruby**: Rails, Sinatra
- **And more...**

#### Language Features
- **Automatic Detection**: Smart language and framework detection from code
- **Specialized AI**: Language-specific prompts and best practices
- **Code Quality**: Integrated linting, formatting, and static analysis
- **Cross-Language Conversion**: Convert code between supported languages
- **Framework Recognition**: Automatic framework and library detection

### Phase 6: Performance Optimization & Scaling

Zenvora Enterprise includes advanced performance optimizations:

#### Caching System
- **Language Detection Cache**: Avoid re-detecting the same code snippets
- **Analysis Cache**: Cache code quality analysis results
- **Project Cache**: Quickly retrieve frequently accessed projects
- **Cache Statistics**: Real-time hit rate and memory usage monitoring
- **Smart Eviction**: LRU eviction when cache reaches capacity

#### Batch Processing
- **Batch Language Detection**: Detect 100+ files simultaneously
- **Batch Analysis**: Analyze multiple files in optimized batch jobs
- **Parallel Processing**: Utilize multi-core processors
- **Progress Tracking**: Monitor batch job execution

#### Database Optimization
- **Query Indexing**: Automatically create helpful indexes
- **Query Analysis**: Identify slow queries
- **Vacuum Operations**: Optimize database file size
- **Index Suggestions**: AI-powered index recommendations
- **Table Statistics**: Real-time performance metrics

#### Performance Monitoring
- **Real-time Metrics**: Track API performance and response times
- **Memory Profiling**: Monitor heap usage and garbage collection
- **Request Profiling**: Detailed timing for each endpoint
- **Memory Snapshots**: Take snapshots for debugging
- **Admin Dashboard**: View all metrics through admin endpoints

#### Performance Endpoints (Admin Only)
- `GET /perf/monitor` - Get performance monitor statistics
- `GET /perf/cache` - Get cache statistics and hit rates
- `GET /perf/profile` - Get request profiling data
- `POST /perf/db/optimize` - Run database optimization
- `GET /perf/db/stats` - Get database performance stats
- `GET /perf/db/slow-queries` - Identify slow queries
- `GET /perf/db/suggestions` - Get index suggestions
- `POST /perf/batch-detect` - Batch language detection
- `POST /perf/batch-analyze` - Batch code analysis
- `POST /perf/memory-snapshot` - Take memory snapshot

## 🌐 Deployment

### Development
```bash
npm run dev          # Start both frontend and backend
npm run dev:backend  # Backend only (port 5000)
npm run dev:frontend # Frontend only (port 3000+)
```

### Production
```bash
npm run build
npm start
```

### Desktop App
```bash
npm run electron-dev  # Development with hot reload
```

### AWS (Amplify + Lambda + RDS)
```bash
# Frontend
amplify init
amplify add hosting
amplify publish

# Backend (API Gateway + Lambda + Aurora)
# Use serverless framework with RDS
```

### Azure (Static Web Apps + Functions + SQL)
```bash
# Frontend
az staticwebapp create
az staticwebapp environment set

# Backend (Azure Functions + SQL Database)
func init
func new
func azure functionapp publish
```

## 🔒 Security & Privacy

- **Local-First**: All AI processing can be done locally
- **Sandboxed Execution**: Code runs in isolated VM environment
- **Secure Authentication**: bcrypt password hashing, JWT tokens
- **Audit Logging**: Complete activity tracking for compliance
- **Rate Limiting**: Protection against abuse
- **Security Headers**: Helmet.js protection
- **Session Security**: Automatic token expiration and validation

## 👥 User Roles & Permissions

### User Role
- Execute code
- Use AI features
- Create and manage personal projects
- View own audit logs

### Admin Role
- All user permissions
- Access admin panel
- View all users and their activity
- Access complete audit logs
- System monitoring and management

## 📊 Audit Logging

All user actions are logged including:
- Authentication events (login/logout)
- Code execution with timing
- AI feature usage
- Project management
- IP addresses and user agents
- Timestamps for compliance

## 🧪 Development

```bash
# Web development
npm run dev

# Desktop app
npm run electron-dev

# Build for production
npm run build
```

## 📈 Roadmap

- **Phase 4** ✅ **COMPLETED**: Enterprise features (authentication, audit logs, project management)
- **Phase 5** ✅ **COMPLETED**: Multi-language support (10+ languages, code quality tools, framework detection)
- **Phase 6** ✅ **COMPLETED**: Performance optimization and scaling
  - Intelligent caching system (language detection, analysis results, projects)
  - Batch processing for multiple files
  - Database query optimization and indexing
  - Real-time performance monitoring and metrics
  - Memory profiling and snapshots

## 🤝 Contributing

Zenvora Enterprise is open-source. Contributions welcome!

## 📄 License

MIT License - see LICENSE file for details.

## 🔧 API Reference

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

### Project Endpoints
- `POST /projects` - Create new project
- `GET /projects` - Get user's projects

### Code Execution Endpoints
- `POST /execute` - Execute JavaScript code
- `POST /generate-code` - AI code generation
- `POST /execute-task` - Autonomous task execution
- `POST /review-code` - Code review analysis
- `POST /debug-error` - Error debugging

### Multi-Language Endpoints
- `POST /detect-language` - Detect programming language and frameworks
- `POST /generate-code-multi` - Generate code in specific language
- `POST /review-code-multi` - Review code with language-specific analysis
- `POST /debug-error-multi` - Debug errors with language expertise
- `POST /analyze-code` - Run linting and static analysis
- `POST /format-code` - Format code with language-specific tools
- `POST /suggest-improvements` - Get code improvement suggestions
- `POST /convert-code` - Convert code between languages
- `GET /languages` - List supported languages
- `GET /tools/:language` - Get available tools for a language

### Admin Endpoints (Admin only)
- `GET /admin/users` - List all users
- `GET /admin/audit-logs` - View audit logs

All endpoints support optional JWT authentication via `Authorization: Bearer <token>` header.
