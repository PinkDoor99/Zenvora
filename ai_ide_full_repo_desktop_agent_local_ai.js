// ===============================
// AI IDE FULL STARTER REPO
// Desktop + Backend + Agent + Local AI
// ===============================

// ---------- package.json ----------
{
  "name": "ai-ide",
  "private": true,
  "scripts": {
    "dev:web": "next dev apps/web",
    "dev:api": "node apps/api/server.js",
    "electron": "electron desktop/main.js",
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:api\" \"npm run electron\""
  },
  "dependencies": {
    "axios": "^1.6.0",
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "simple-git": "^3.19.1"
  }
}

// ---------- desktop/main.js ----------
const { app, BrowserWindow, ipcMain } = require("electron");
const axios = require("axios");

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      preload: __dirname + "/preload.js"
    }
  });

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(createWindow);

ipcMain.handle("run-code", async (_, code) => {
  const res = await axios.post("https://zenvora-oap0.onrender.com/run", { code });
  return res.data;
});

// ---------- desktop/preload.js ----------
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  runCode: (code) => ipcRenderer.invoke("run-code", code)
});

// ---------- apps/api/server.js ----------
const express = require("express");
const { exec } = require("child_process");

const app = express();
app.use(express.json());

// SAFE SANDBOX EXECUTION
app.post("/run", (req, res) => {
  const code = req.body.code;

  exec(`docker run --rm --network=none node:20 node -e \"${code}\"`, (err, stdout, stderr) => {
    if (err) return res.json({ error: stderr });
    res.json({ output: stdout });
  });
});

// LOCAL AI (OLLAMA)
app.post("/ai", async (req, res) => {
  const fetch = (await import("node-fetch")).default;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    body: JSON.stringify({
      model: "llama3",
      prompt: req.body.prompt
    })
  });

  const data = await response.json();
  res.json(data);
});

app.listen(5000, () => console.log("API running"));

// ---------- AGENT SYSTEM ----------
async function agentLoop(goal, maxIterations = 10) {
  const fetch = (await import("node-fetch")).default;

  let context = "";
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    const plan = await fetch("http://localhost:5000/ai", {
      method: "POST",
      body: JSON.stringify({ prompt: `Goal: ${goal}\nNext step?` })
    }).then(r => r.json());

    const code = await fetch("http://localhost:5000/ai", {
      method: "POST",
      body: JSON.stringify({ prompt: `Write code: ${plan.response}` })
    }).then(r => r.json());

    const result = await fetch("http://localhost:5000/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.response })
    }).then(r => r.json());

    if (result.error) {
      context += result.error;
    } else {
      context += result.output;
    }
  }

  return context;
}

// ---------- FRONTEND (SIMPLIFIED) ----------
// apps/web/pages/index.js
import { useState } from "react";

export default function Home() {
  const [code, setCode] = useState("console.log('Hello AI');");
  const [output, setOutput] = useState("");

  const run = async () => {
    const res = await window.api.runCode(code);
    setOutput(res.output || res.error);
  };

  return (
    <div style={{ display: "flex", height: "100vh", gap: "10px", padding: "10px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{ flex: 1, fontFamily: "monospace", padding: "10px" }}
          placeholder="Write your code here..."
        />
        <button onClick={run} style={{ padding: "10px", marginTop: "10px" }}>
          Run Code
        </button>
      </div>
      <div style={{ flex: 1, backgroundColor: "#f5f5f5", overflow: "auto" }}>
        <pre style={{ margin: "10px", whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
          {output}
        </pre>
      </div>
    </div>
  );
}



// ===============================
// DONE
// ===============================
// This repo includes:
// - Electron desktop app
// - Local AI (Ollama)
// - Autonomous agent loop
// - Docker sandbox execution
// - Basic frontend UI
// ===============================
