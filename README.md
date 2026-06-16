# science-alive-webshell
 
A web-based terminal emulator for classroom use. Students connect through a browser and get an isolated Ubuntu environment to explore.
 
---
 
## Requirements
 
- A Linux machine (Ubuntu 22.04 recommended)
- Node.js 20+
- Docker
---
 
## 1. Install Node.js
 
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
 
## 2. Install Docker
 
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```
 
Log out and back in after this, then verify:
```bash
docker --version
```
 
## 3. Set up environment variables
 
Copy `.env.example` to `.env` and set the class password:

```bash
cp .env.example .env
```

```
class_password=yourpasswordhere
```

This single password is used by everyone to log in, sign up, and create guest
accounts. The server refuses to start if it is not set.
 
## 4. Build the student Docker image
 
This creates the Ubuntu sandbox that each student runs in. Only needs to be done once, or whenever you update the Dockerfile.
 
```bash
docker build -f Dockerfile -t classroom-student .
```
 
This will take a few minutes the first time.
 
## 5. Install Node dependencies
 
```bash
npm install
```
 
## 6. Start the server
 
```bash
npm start
```
 
The server will start on port 8888.
 
## Keeping the server running
 
To keep the server running after you close the terminal, use PM2:
 
```bash
sudo npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup
```
 
Useful PM2 commands:
```bash
pm2 status          # check if server is running
pm2 logs            # view server logs
pm2 restart server  # restart after changes
pm2 stop server     # stop the server
```
 
## Managing students
 
Students are stored in `userManagement/users.json` as usernames only — there are
no per-user passwords. Everyone authenticates with the shared `class_password`
from `.env`.
 
```json
{
  "users": [
    { "username": "ScienceAliveAdmin" },
    { "username": "alice" },
    { "username": "bob" }
  ]
}
```

Students can create their own account from the Sign Up page using the class
password. Guest accounts (`guestN`) are generated automatically and stored in
`userManagement/guests.json`, which is runtime data and is not tracked in git.
 
## Managing docker volumes
 
Each user is given their own docker volume so their data persists.

View and remove docker volumes using:

```
docker volume ls
docker volume rm <name>
```
 
## Troubleshooting
 
**Port 8888 already in use:**
```bash
PORT=9000 npm start
```
 
**Docker permission denied:**
```bash
sudo usermod -aG docker $USER
# log out and back in
```
 
**node-pty fails to install:**
```bash
sudo apt install -y make g++ python3
npm install
```
 
**Docker build cache corruption:**
```bash
docker builder prune -f
docker build --no-cache -f Dockerfile -t classroom-student .
```
 
**Students get wrong terminal width:**
Make sure students are using a modern browser and have the terminal window fully loaded before typing.
