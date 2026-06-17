const crypto = require('crypto');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
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

// Usernames become the Docker container name and volume source, so they must be
// safe Docker identifiers. This allowlist matches Docker's name rules and bounds
// the length.
const USERNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,31}$/;

// Names a self-service sign-up must not claim: in-image system users (spoofing /
// confusion) and the special login identities. The admin still uses its own name
// to get a terminal, so this list is only enforced at sign-up, not at connect.
const RESERVED_USERNAMES = new Set([
	'student', 'wizard', 'goblin', 'troll', 'root',
	'ScienceAliveAdmin', 'ScienceAliveGuest',
]);

function isValidUsername(username) {
	return typeof username === 'string' && USERNAME_RE.test(username);
}

// Is a container with exactly this name already running/present? Used to give a
// friendly "session already active" message instead of a raw Docker name conflict.
function containerExists(name, cb) {
	execFile('docker', ['ps', '-aq', '--filter', `name=^${name}$`], (err, stdout) => {
		if (err) return cb(false);   // on error, let `docker run` surface the real problem
		cb(stdout.trim().length > 0);
	});
}

// Remove any classroom containers left over from a previous server run so a crash
// or restart doesn't strand stale containers (and block their --name on reconnect).
function sweepOrphans() {
	execFile('docker', ['ps', '-aq', '--filter', 'label=classroom=student'], (err, stdout) => {
		if (err) return;
		const ids = stdout.trim().split('\n').filter(Boolean);
		if (ids.length === 0) return;
		execFile('docker', ['rm', '-f', ...ids], () => {
			console.log(`Cleaned up ${ids.length} orphaned classroom container(s).`);
		});
	});
}

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

	// usernames become Docker container/volume names — enforce a safe allowlist
	if (!isValidUsername(username)) {
		return res.status(400).json({ error: 'Username must be 1-32 characters: letters, numbers, and . _ - only (must start with a letter or number).' });
	}
	if (RESERVED_USERNAMES.has(username)) {
		return res.status(400).json({ error: 'That username is reserved. Please pick another.' });
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

	// Defense-in-depth: usernames also reach `docker run` as the container name and
	// volume source, so re-validate here even though login/sign-up already check.
	if (!isValidUsername(username)) {
		ws.close();
		return;
	}

	// One session per account: the container is named after the user, so a second
	// connection would hit a Docker name conflict. Tell the user plainly instead.
	containerExists(username, (exists) => {
		if (ws.readyState !== WebSocket.OPEN) return;
		if (exists) {
			ws.send(JSON.stringify({ type: 'output', data:
				'\r\n\x1b[33mA session is already active for this account in another tab or window.\r\n' +
				'Close it before opening a new one.\x1b[0m\r\n' }));
			ws.send(JSON.stringify({ type: 'exit', exitCode: 0 }));
			ws.close();
			return;
		}
		startSession(ws, username);
	});
});

// Spawns the hardened per-user container and bridges it to the WebSocket.
function startSession(ws, username) {
	const shell = pty.spawn('docker', [
		'run', '--rm', '-it',
		'--name', `${username}`,
		'--label', 'classroom=student',
		// ── Resource limits ──
		'--memory', '40m',
		'--cpus', '0.5',
		'--pids-limit', '50',
		'--ulimit', 'nofile=1024:1024',
		'--ulimit', 'core=0:0',
		'--ulimit', 'fsize=52428800:52428800',   // 50 MB max single file (disk-bomb guard)
		// ── Isolation ──
		// No network at all: the maze is filesystem-only, so this blocks the GCP
		// metadata server (169.254.169.254) and any internal scanning outright.
		'--network', 'none',
		// Drop every capability. The CMD runs as the non-root `student` user and the
		// puzzle's SUID binaries elevate only to `wizard` (also non-root), so no
		// capability is needed. NOTE: we intentionally do NOT pass no-new-privileges —
		// it disables SUID and would break the enter_password/enter_glyph puzzle.
		// Host safety comes from userns-remap (daemon.json), --network none and caps.
		'--cap-drop', 'ALL',
		// Read-only root filesystem; only the home volume and small tmpfs are writable.
		// gcc needs a writable /tmp for intermediates.
		'--read-only',
		'--tmpfs', '/tmp:rw,nosuid,nodev,size=32m',
		'--tmpfs', '/run:rw,nosuid,nodev,size=4m',
		'--env', `USERNAME=${username}`,
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
}


const PORT = process.env.PORT || 8888;
server.listen(PORT, () => {
	sweepOrphans();
	console.log(`Terminal server running at http://localhost:${PORT}`);
});
