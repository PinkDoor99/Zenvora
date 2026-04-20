const fs = require('fs');
const path = require('path');

class LanguageDetector {
  constructor() {
    // Language patterns for file extension detection
    this.extensionMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.sql': 'sql',
      '.sh': 'bash',
      '.ps1': 'powershell',
      '.r': 'r',
      '.m': 'matlab',
      '.pl': 'perl',
      '.lua': 'lua',
      '.dart': 'dart',
      '.elm': 'elm',
      '.hs': 'haskell',
      '.clj': 'clojure',
      '.fs': 'fsharp',
      '.vb': 'vbnet'
    };

    // Language patterns for content-based detection
    this.languagePatterns = {
      javascript: [
        /\b(function|const|let|var|if|else|for|while|return|class|import|export)\b/,
        /\b(console\.log|document\.|window\.|require\(|module\.exports)\b/
      ],
      typescript: [
        /\b(interface|type|enum|implements|public|private|protected)\b/,
        /\b(: (string|number|boolean|any|void))\b/
      ],
      python: [
        /\b(def |class |import |from |if __name__ == ['"]__main__['"])\b/,
        /\b(print|len|range|str|int|float|list|dict|set|tuple)\b/
      ],
      java: [
        /\b(public static void main|System\.out\.println|import java\.|class \w+ \{)\b/,
        /\b(String|int|void|boolean|double|float|char)\b\[\]?\s+\w+/
      ],
      cpp: [
        /\b(#include <iostream>|using namespace std;|cout <<|cin >>)\b/,
        /\b(int main\(|void|int|string|char|float|double)\b/
      ],
      csharp: [
        /\b(using System;|Console\.WriteLine|namespace \w+|public class)\b/,
        /\b(string|int|void|bool|double|float|char)\b/
      ],
      go: [
        /\b(package main|import|func main|fmt\.Println)\b/,
        /\b(var|const|type|struct|interface)\b/
      ],
      rust: [
        /\b(fn main|println!|use std::|let mut|impl|struct|enum)\b/,
        /\b(String|i32|f64|bool|Vec|HashMap)\b/
      ],
      php: [
        /\b(<?php|echo|print|function|class|public|private|protected)\b/,
        /\$\w+/
      ],
      ruby: [
        /\b(def |class |puts|require|include|attr_accessor)\b/,
        /\b(end|do|\.each|\.map|\.select)\b/
      ]
    };

    // Framework detection patterns
    this.frameworkPatterns = {
      react: [
        /\b(import React|from 'react'|useState|useEffect|useContext)\b/,
        /\b(JSX\.Element|React\.FC|React\.Component)\b/
      ],
      vue: [
        /\b(import Vue|from 'vue'|Vue\.createApp|<template>|<script setup)\b/,
        /\b(defineComponent|ref|reactive|computed)\b/
      ],
      angular: [
        /\b(import \{.*\} from '@angular\/core'|Component|NgModule|Injectable)\b/,
        /\b(@Component|@NgModule|@Injectable)\b/
      ],
      express: [
        /\b(const express|app\.get|app\.post|app\.use|require\('express'\))\b/,
        /\b(app\.listen|middleware|router)\b/
      ],
      django: [
        /\b(from django|import django|django\.|models\.Model|views\.|urls\.)\b/,
        /\b(def __str__|class Meta)\b/
      ],
      flask: [
        /\b(from flask import|Flask\(|@app\.route)\b/,
        /\b(app\.run\(|request|jsonify)\b/
      ],
      fastapi: [
        /\b(from fastapi import|FastAPI|@app\.(get|post))\b/,
        /\b(BaseModel|Pydantic|Depends)\b/
      ]
    };
  }

  // Detect language from file extension
  detectFromExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.extensionMap[ext] || 'unknown';
  }

  // Detect language from content - improved with better pattern weighting
  detectFromContent(content, filePath = '') {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath).toLowerCase();

    // Special cases for files without extensions or specific filenames
    if (filename === 'dockerfile') return 'dockerfile';
    if (filename === 'makefile') return 'makefile';
    if (filename === 'cmakelists.txt') return 'cmake';
    if (filename.startsWith('readme')) return 'markdown';

    // Check extension first (most reliable)
    if (ext && this.extensionMap[ext]) {
      return this.extensionMap[ext];
    }

    // Content-based detection with scoring
    const scores = {};

    for (const [language, patterns] of Object.entries(this.languagePatterns)) {
      let score = 0;
      patterns.forEach((pattern, index) => {
        if (pattern.test(content)) {
          // Weight: first pattern in array is more important (2x)
          score += index === 0 ? 2 : 1;
        }
      });
      if (score > 0) {
        scores[language] = score;
      }
    }

    // Get language with highest score
    if (Object.keys(scores).length > 0) {
      const bestLanguage = Object.entries(scores).sort(([_, a], [__, b]) => b - a)[0][0];
      return bestLanguage;
    }

    // Shebang detection
    const shebangMatch = content.match(/^#!\s*(.+)/);
    if (shebangMatch) {
      const shebang = shebangMatch[1].toLowerCase();
      if (shebang.includes('python')) return 'python';
      if (shebang.includes('node')) return 'javascript';
      if (shebang.includes('bash') || shebang.includes('sh')) return 'bash';
      if (shebang.includes('ruby')) return 'ruby';
      if (shebang.includes('perl')) return 'perl';
    }

    return 'unknown';
  }

  // Detect frameworks from content
  detectFrameworks(content, language) {
    const frameworks = [];

    for (const [framework, patterns] of Object.entries(this.frameworkPatterns)) {
      const matches = patterns.reduce((count, pattern) => {
        const matches = content.match(pattern);
        return count + (matches ? matches.length : 0);
      }, 0);

      if (matches >= 1) {
        frameworks.push(framework);
      }
    }

    return frameworks;
  }

  // Comprehensive detection combining extension and content
  detect(filePath, content = null) {
    let language = 'unknown';
    let frameworks = [];

    // Try extension detection first
    language = this.detectFromExtension(filePath);

    // If content is provided, use content-based detection
    if (content) {
      const contentLanguage = this.detectFromContent(content, filePath);
      if (contentLanguage !== 'unknown') {
        language = contentLanguage;
      }

      // Detect frameworks
      frameworks = this.detectFrameworks(content, language);
    }

    return {
      language,
      frameworks,
      filePath,
      extension: path.extname(filePath)
    };
  }

  // Get language metadata
  getLanguageInfo(language) {
    const languageInfo = {
      javascript: {
        name: 'JavaScript',
        extensions: ['.js', '.jsx'],
        frameworks: ['react', 'vue', 'angular', 'express', 'node'],
        linters: ['eslint'],
        formatters: ['prettier'],
        compilers: ['babel', 'webpack']
      },
      typescript: {
        name: 'TypeScript',
        extensions: ['.ts', '.tsx'],
        frameworks: ['react', 'vue', 'angular', 'express', 'nest'],
        linters: ['eslint', 'tslint'],
        formatters: ['prettier'],
        compilers: ['tsc']
      },
      python: {
        name: 'Python',
        extensions: ['.py'],
        frameworks: ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
        linters: ['pylint', 'flake8'],
        formatters: ['black', 'autopep8'],
        compilers: []
      },
      java: {
        name: 'Java',
        extensions: ['.java'],
        frameworks: ['spring', 'hibernate', 'maven', 'gradle'],
        linters: ['checkstyle', 'spotbugs'],
        formatters: ['google-java-format'],
        compilers: ['javac']
      },
      cpp: {
        name: 'C++',
        extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx'],
        frameworks: ['qt', 'boost', 'opencv'],
        linters: ['cppcheck', 'clang-tidy'],
        formatters: ['clang-format'],
        compilers: ['gcc', 'clang', 'msvc']
      },
      csharp: {
        name: 'C#',
        extensions: ['.cs'],
        frameworks: ['.net', 'asp.net', 'entity-framework'],
        linters: ['stylecop', 'resharper'],
        formatters: ['csharpier'],
        compilers: ['dotnet']
      },
      go: {
        name: 'Go',
        extensions: ['.go'],
        frameworks: ['gin', 'echo', 'fiber'],
        linters: ['golint', 'golangci-lint'],
        formatters: ['gofmt', 'goimports'],
        compilers: ['go']
      },
      rust: {
        name: 'Rust',
        extensions: ['.rs'],
        frameworks: ['tokio', 'rocket', 'actix'],
        linters: ['clippy'],
        formatters: ['rustfmt'],
        compilers: ['rustc', 'cargo']
      }
    };

    return languageInfo[language] || {
      name: language.charAt(0).toUpperCase() + language.slice(1),
      extensions: [],
      frameworks: [],
      linters: [],
      formatters: [],
      compilers: []
    };
  }
}

module.exports = new LanguageDetector();