const axios = require('axios');
const OpenAI = require('openai');
const languageDetector = require('./languageDetector');

class HybridAI {
  constructor() {
    this.localUrl = 'http://localhost:11434/api/chat';
    this.localModel = 'llama3.2:1b';
    this.openai = null;
    this.useCloud = false;
  }

  initCloud(apiKey) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.useCloud = true;
    }
  }

  async chat(messages, options = {}) {
    const timeout = options.timeout || 5000; // 5 second timeout

    if (this.useCloud && this.openai) {
      try {
        const response = await Promise.race([
          this.openai.chat.completions.create({
            model: options.model || 'gpt-4',
            messages,
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud AI timeout')), timeout))
        ]);
        return response.choices[0].message.content;
      } catch (error) {
        console.warn('Cloud AI failed, falling back to local:', error.message);
        this.useCloud = false;
      }
    }

    try {
      const response = await Promise.race([
        axios.post(this.localUrl, {
          model: this.localModel,
          messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Local AI timeout')), timeout))
      ]);
      return response.data.message.content;
    } catch (error) {
      console.warn('Local AI failed:', error.message);
      // Fallback response
      return 'AI service temporarily unavailable. Please try again later or ensure Ollama is running with the llama3.2 model.';
    }
  }

  // Get language-specific system prompts
  getLanguagePrompts(language, task) {
    const languageInfo = languageDetector.getLanguageInfo(language);
    const langName = languageInfo.name;

    const prompts = {
      generateCode: {
        javascript: `You are an expert JavaScript developer. Generate clean, efficient, and modern JavaScript code following ES6+ standards. Use appropriate frameworks if specified. Only output the code, no explanations.`,
        typescript: `You are an expert TypeScript developer. Generate type-safe, clean, and efficient TypeScript code. Use proper type annotations and modern TypeScript features. Only output the code, no explanations.`,
        python: `You are an expert Python developer. Generate clean, efficient, and Pythonic code following PEP 8 standards. Use appropriate libraries and frameworks. Only output the code, no explanations.`,
        java: `You are an expert Java developer. Generate clean, object-oriented Java code following Java conventions and best practices. Only output the code, no explanations.`,
        cpp: `You are an expert C++ developer. Generate clean, efficient C++ code following modern C++ standards (C++11/14/17/20). Use RAII and smart pointers appropriately. Only output the code, no explanations.`,
        csharp: `You are an expert C# developer. Generate clean, efficient C# code following .NET best practices and conventions. Only output the code, no explanations.`,
        go: `You are an expert Go developer. Generate clean, idiomatic Go code following Go conventions and best practices. Only output the code, no explanations.`,
        rust: `You are an expert Rust developer. Generate safe, efficient, and idiomatic Rust code following Rust best practices and ownership principles. Only output the code, no explanations.`,
        php: `You are an expert PHP developer. Generate clean, secure PHP code following PSR standards and best practices. Only output the code, no explanations.`,
        ruby: `You are an expert Ruby developer. Generate clean, elegant Ruby code following Ruby conventions and best practices. Only output the code, no explanations.`
      },
      reviewCode: {
        javascript: `You are a senior JavaScript code reviewer. Analyze the code for:
- Security vulnerabilities (XSS, injection, etc.)
- Performance issues
- Code quality problems
- ES6+ best practices
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`,
        typescript: `You are a senior TypeScript code reviewer. Analyze the code for:
- Type safety issues
- Security vulnerabilities
- Performance issues
- Code quality problems
- TypeScript best practices
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`,
        python: `You are a senior Python code reviewer. Analyze the code for:
- Security vulnerabilities
- Performance issues
- Code quality problems
- PEP 8 compliance
- Pythonic idioms and best practices
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`,
        java: `You are a senior Java code reviewer. Analyze the code for:
- Security vulnerabilities
- Performance issues
- Code quality problems
- Java conventions and best practices
- OOP principles
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`,
        cpp: `You are a senior C++ code reviewer. Analyze the code for:
- Memory safety issues
- Performance issues
- Code quality problems
- Modern C++ best practices
- RAII and resource management
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`,
        csharp: `You are a senior C# code reviewer. Analyze the code for:
- Security vulnerabilities
- Performance issues
- Code quality problems
- .NET best practices
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`,
        go: `You are a senior Go code reviewer. Analyze the code for:
- Concurrency safety issues
- Performance issues
- Code quality problems
- Go idioms and best practices
- Error handling patterns
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`,
        rust: `You are a senior Rust code reviewer. Analyze the code for:
- Memory safety and ownership issues
- Performance issues
- Code quality problems
- Rust best practices and idioms
- Concurrency safety
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`,
        php: `You are a senior PHP code reviewer. Analyze the code for:
- Security vulnerabilities (injection, XSS, etc.)
- Performance issues
- Code quality problems
- PSR standards compliance
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`,
        ruby: `You are a senior Ruby code reviewer. Analyze the code for:
- Security vulnerabilities
- Performance issues
- Code quality problems
- Ruby conventions and best practices
- Framework-specific conventions
- Potential bugs and edge cases

Provide specific recommendations with severity levels (High/Medium/Low) and code examples for fixes.`
      },
      debugError: {
        javascript: `You are an expert JavaScript debugger. Analyze the error and code, then provide:
1. Root cause analysis
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common pitfalls to avoid`,
        typescript: `You are an expert TypeScript debugger. Analyze the error and code, then provide:
1. Root cause analysis (including type-related issues)
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common TypeScript pitfalls to avoid`,
        python: `You are an expert Python debugger. Analyze the error and code, then provide:
1. Root cause analysis
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common Python pitfalls to avoid`,
        java: `You are an expert Java debugger. Analyze the error and code, then provide:
1. Root cause analysis
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common Java pitfalls to avoid`,
        cpp: `You are an expert C++ debugger. Analyze the error and code, then provide:
1. Root cause analysis (memory, pointers, etc.)
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common C++ pitfalls to avoid`,
        csharp: `You are an expert C# debugger. Analyze the error and code, then provide:
1. Root cause analysis
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common C# pitfalls to avoid`,
        go: `You are an expert Go debugger. Analyze the error and code, then provide:
1. Root cause analysis
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common Go pitfalls to avoid`,
        rust: `You are an expert Rust debugger. Analyze the error and code, then provide:
1. Root cause analysis (ownership, borrowing, lifetimes)
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common Rust pitfalls to avoid`,
        php: `You are an expert PHP debugger. Analyze the error and code, then provide:
1. Root cause analysis
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common PHP pitfalls to avoid`,
        ruby: `You are an expert Ruby debugger. Analyze the error and code, then provide:
1. Root cause analysis
2. Specific fix recommendations with code examples
3. Prevention tips and best practices
4. Common Ruby pitfalls to avoid`
      }
    };

    return prompts[task]?.[language] || prompts[task]?.javascript || `You are an expert ${langName} developer. ${task === 'generateCode' ? 'Generate clean, efficient code. Only output the code, no explanations.' : task === 'reviewCode' ? 'Review the code for quality, security, and best practices.' : 'Debug the error and provide specific fix recommendations.'}`;
  }

  async generateCode(prompt, context = '', language = 'javascript', frameworks = []) {
    const systemPrompt = this.getLanguagePrompts(language, 'generateCode');

    // Add framework context if specified
    let enhancedPrompt = prompt;
    if (frameworks.length > 0) {
      const frameworkContext = frameworks.map(fw => fw.charAt(0).toUpperCase() + fw.slice(1)).join(', ');
      enhancedPrompt = `Using ${frameworkContext} framework(s): ${prompt}`;
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: context ? `Context:\n${context}\n\nRequest: ${enhancedPrompt}` : enhancedPrompt
      }
    ];

    return await this.chat(messages, { temperature: 0.3 });
  }

  async reviewCode(code, language = 'javascript', frameworks = []) {
    const systemPrompt = this.getLanguagePrompts(language, 'reviewCode');

    // Add framework context
    let enhancedPrompt = code;
    if (frameworks.length > 0) {
      const frameworkContext = frameworks.map(fw => fw.charAt(0).toUpperCase() + fw.slice(1)).join(', ');
      enhancedPrompt = `Framework(s): ${frameworkContext}\n\nCode to review:\n${code}`;
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: enhancedPrompt
      }
    ];

    return await this.chat(messages, { temperature: 0.2 });
  }

  async debugError(error, code, language = 'javascript', frameworks = []) {
    const systemPrompt = this.getLanguagePrompts(language, 'debugError');

    // Add framework context
    let enhancedPrompt = `Error: ${error}\n\nCode:\n${code}`;
    if (frameworks.length > 0) {
      const frameworkContext = frameworks.map(fw => fw.charAt(0).toUpperCase() + fw.slice(1)).join(', ');
      enhancedPrompt = `Framework(s): ${frameworkContext}\n\n${enhancedPrompt}`;
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: enhancedPrompt
      }
    ];

    return await this.chat(messages, { temperature: 0.1 });
  }

  // New method: Detect language and frameworks from code
  async analyzeCode(code, filePath = '') {
    const detection = languageDetector.detect(filePath, code);

    return {
      language: detection.language,
      frameworks: detection.frameworks,
      languageInfo: languageDetector.getLanguageInfo(detection.language),
      confidence: detection.language !== 'unknown' ? 'high' : 'low'
    };
  }

  // New method: Get language-specific suggestions
  async getSuggestions(code, language, frameworks = [], context = '') {
    const languageInfo = languageDetector.getLanguageInfo(language);
    const langName = languageInfo.name;

    let systemPrompt = `You are an expert ${langName} developer. Provide helpful suggestions for improving the code, including:
- Code optimization opportunities
- Best practices adherence
- Framework-specific recommendations
- Performance improvements
- Maintainability enhancements

Be specific and provide actionable suggestions.`;

    if (frameworks.length > 0) {
      const frameworkContext = frameworks.map(fw => fw.charAt(0).toUpperCase() + fw.slice(1)).join(', ');
      systemPrompt += `\n\nConsider ${frameworkContext} framework best practices.`;
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: context ? `Context: ${context}\n\nCode:\n${code}` : `Code:\n${code}`
      }
    ];

    return await this.chat(messages, { temperature: 0.3 });
  }

  // New method: Cross-language conversion
  async convertCode(code, fromLanguage, toLanguage, frameworks = []) {
    const fromInfo = languageDetector.getLanguageInfo(fromLanguage);
    const toInfo = languageDetector.getLanguageInfo(toLanguage);

    const systemPrompt = `You are an expert developer skilled in both ${fromInfo.name} and ${toInfo.name}. Convert the provided code from ${fromInfo.name} to ${toInfo.name} following the target language's best practices and idioms.

Consider:
- Language-specific patterns and conventions
- Framework equivalents (if applicable)
- Type systems and data structures
- Error handling patterns
- Performance characteristics

Only output the converted code, no explanations.`;

    let enhancedPrompt = code;
    if (frameworks.length > 0) {
      const frameworkContext = frameworks.map(fw => fw.charAt(0).toUpperCase() + fw.slice(1)).join(', ');
      enhancedPrompt = `Original frameworks: ${frameworkContext}\n\n${code}`;
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: enhancedPrompt
      }
    ];

    return await this.chat(messages, { temperature: 0.2 });
  }
}

module.exports = new HybridAI();
