const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

// Track active sessions
const sessions = new Map();
let counter = 0;

wss.on('connection', (ws, req) => {
  const sessionId = counter;
  counter++;
  console.log(`New connection: ${sessionId}`);

  // Spawn a bash shell inside Docker (or locally for dev)
  const shell = pty.spawn('docker', [
    'run', '--rm', '-it',
    '--name', `student-${sessionId}`,
    'classroom-student'
], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    env: { ...process.env, TERM: 'xterm-256color' }
});

  sessions.set(sessionId, shell);

  // Shell → browser
  shell.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  shell.onExit(({ exitCode }) => {
    console.log(`Shell exited for ${sessionId} with code ${exitCode}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', exitCode }));
      ws.close();
    }
    sessions.delete(sessionId);
  });

  // Browser → shell
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'input') {
        shell.write(msg.data);
      } else if (msg.type === 'resize') {
        shell.resize(msg.cols, msg.rows);
      }
    } catch (e) {
      console.error('Bad message:', e);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket closed for ${sessionId}`);
    shell.kill();
    sessions.delete(sessionId);
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for ${sessionId}:`, err);
  });
});

const PORT = process.env.PORT || 8888;
server.listen(PORT, () => {
  console.log(`Terminal server running at http://localhost:${PORT}`);
});
