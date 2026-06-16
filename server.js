const crypto = require('crypto');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');
const fs = require('fs');
require('dotenv').config();


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const USERS_FILE = path.join(__dirname, 'userManagement/users.json');
const GUESTS_FILE = path.join(__dirname, 'userManagement/guests.json');
const class_password = process.env.class_password;

if (!class_password) {
	console.error('class_password is not set. Create a .env file with class_password=... (see .env.example).');
	process.exit(1);
}

const tokens = new Map();

// guests.json is runtime data (not tracked in git) — create it on first run
if (!fs.existsSync(GUESTS_FILE)) {
	fs.writeFileSync(GUESTS_FILE, JSON.stringify({ guests: [] }, null, 2));
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


// ── helpers ─────────────────────────────────────────────────────────────────

function readJson(file) {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function issueToken(res, username, role) {
	const token = crypto.randomBytes(32).toString('hex');
	tokens.set(token, { username, role, expires: Date.now() + 8 * 60 * 60 * 1000 });
	return res.json({ token, username, role });
}

function validateToken(token) {
	const info = tokens.get(token);

	if (!info) {
		return null;
	}

	if (Date.now() > info.expires) {
		tokens.delete(token);
		return null;
	}

	return info;
}


// ── routes ──────────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
	let { username, password } = req.body || {};
	if (!username || !password) {
		return res.status(400).json({ error: 'Username and password are required.' });
	}

	const users = readJson(USERS_FILE);
	const guests = readJson(GUESTS_FILE);

	// check if a new guest account is being created
	if (username === 'ScienceAliveGuest' && password === class_password) {
		const newID = guests.guests.length === 0 ? 0 : guests.guests.at(-1).id + 1;
		username = 'guest' + newID;
		guests.guests.push({ username, id: newID });
		writeJson(GUESTS_FILE, guests);
	}

	const guest = guests.guests.find(s => s.username === username);
	const user = users.users.find(s => s.username === username);

	if (guest && password === class_password) {			// guest login
		return issueToken(res, username, 'guest');
	}
	else if (user && password === class_password) {			// student / admin login
		const role = user.username === 'ScienceAliveAdmin' ? 'admin' : 'student';
		return issueToken(res, username, role);
	}
	else {
		return res.status(401).json({ error: 'Invalid username or password' });
	}
});


app.post('/api/sign-up', (req, res) => {
	const { username, password } = req.body || {};
	if (!username || !password) {
		return res.status(400).json({ error: 'Username and password are required.' });
	}

	const users = readJson(USERS_FILE);

	// check if username already exists
	if (users.users.find(s => s.username === username)) {
		return res.status(401).json({ error: 'User already exists. Please pick a new username.' });
	}

	// check the class password matches
	if (password !== class_password) {
		return res.status(401).json({ error: 'Incorrect password.' });
	}

	// add the user
	users.users.push({ username });
	writeJson(USERS_FILE, users);
	return res.json({ username });
});


// ── terminal websocket ────────────────────────────────────────────────────────

wss.on('connection', (ws, req) => {
	const url = new URL(req.url, 'http://x');
	const token = url.searchParams.get('token');

	// check token is valid
	const info = validateToken(token);
	if (!info) {
		ws.close();
		return;
	}

	// derive identity from the token, never from the query string
	const username = info.username;

	const shell = pty.spawn('docker', [
		'run', '--rm', '-it',
		'--name', `${username}`,
		'--memory', '40m',
		'--cpus', '0.5',
		'--pids-limit', '50',
		'--security-opt=no-new-privileges',
		'--env', `USERNAME=${username}`,
		'--cap-drop', 'ALL',
		'--cap-add', 'CHOWN',
		'--mount', `type=volume,source=${username},target=/home/student`,
		'classroom-student'
	], {
		name: 'xterm-color',
		env: { ...process.env, TERM: 'xterm-256color' }
	});

	shell.onData((data) => {
		if (ws.readyState === WebSocket.OPEN)
			ws.send(JSON.stringify({ type: 'output', data }));
	});

	shell.onExit(({ exitCode }) => {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: 'exit', exitCode }));
			ws.close();
		}
	});

	ws.on('message', (message) => {
		try {
			const msg = JSON.parse(message);
			if (msg.type === 'input')  shell.write(msg.data);
			if (msg.type === 'resize') shell.resize(msg.cols, msg.rows);
		} catch (e) { console.error('Bad message:', e); }
	});

	ws.on('close', () => { shell.kill(); });
});


const PORT = process.env.PORT || 8888;
server.listen(PORT, () => {
	console.log(`Terminal server running at http://localhost:${PORT}`);
});
