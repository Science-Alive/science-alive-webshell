const crypto = require('crypto');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const USERS_FILE = path.join(__dirname, 'users.json');
const GUESTS_FILE = path.join(__dirname, 'guests.json');
tokens = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());



//routes

app.post('/api/login', (req, res) => {
	let { username, password } = req.body;
	const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
	const guests = JSON.parse(fs.readFileSync(GUESTS_FILE, 'utf8'));

	//check if new guest account is being created
	if (username == 'ScienceAliveGuest' && password == guests.password){
		//create new guest account
		let newID = 0;
		if(guests.guests.length == 0){
			newID = 0;
		}
		else{
			newID = guests.guests.at(-1).id + 1;
		}
		
		username = "guest" + newID;

		const newGuest = {"username": username, "id": newID};
		guests.guests.push(newGuest);

		fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2), (err) => {
			if (err) throw err;
		});
	}
	
	let role = 'student';
	let guest = guests.guests.find(s => s.username === username);
	let user = users.find(s => s.username === username && s.password === password);

	if (guest && password == guests.password){		//check if guest
		role = 'guest';
		const token = crypto.randomBytes(32).toString('hex');
		tokens.set(token, { username: username, role: role, expires: Date.now() + 8 * 60 * 60 * 1000 });
		return res.json({ token, username, role });
	}
	else if (user){		//check if user 
		//check if admin
		if(user.username == 'ScienceAliveAdmin'){
			role = 'admin';
		}
		else{
			role = 'student'
		}
		const token = crypto.randomBytes(32).toString('hex');
		tokens.set(token, { username: username, role: role, expires: Date.now() + 8 * 60 * 60 * 1000 });
		return res.json({ token, username, role });
	}
	else{
		//reject user
		role = null;
		return res.status(401).json({ error: 'Invalid username or password' });
	}
});

function validateToken(token) {
	const info = tokens.get(token)  
	
	if (!info){
		return null       
	}

	if (Date.now() > info.expires) {
		tokens.delete(token)          
		return null
	}
	
	return info                    
}

//todo handle admin / guest accounts
wss.on('connection', (ws, req) => {
	const url = new URL(req.url, 'http://x');
	let username = url.searchParams.get('username');
	const token = url.searchParams.get('token');

	// check token is valid
	const info = validateToken(token)       
	if (!info) {
		ws.close() 
		return
	}

	let role = tokens.get(token).role;

	const shell = pty.spawn('docker', [
		'run', '--rm', '-it',
		'--name', `${username}`,
		'--memory', '128m',
		'--cpus', '0.5',
		'--pids-limit', '50',
		'--security-opt=no-new-privileges',
		'--env', `USERNAME=${username}`,
		//'--cap-drop', 'ALL',
		//'--cap-add', 'CHOWN',
		'--mount', `type=volume,source=${username},target=/home/student`,
		'classroom-student'
	], {
		name: 'xterm-color',
		cols: 80, rows: 24,
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
