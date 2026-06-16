// Shared auth helpers for the login and sign-up pages.

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { res, data };
}

// Logs in, stores the session, and redirects to the terminal.
// On failure it writes to #error and re-enables the optional button.
async function login(username, password, btn) {
  const error = document.getElementById('error');

  if (!username || !password) {
    error.textContent = 'Please enter your username and password.';
    return;
  }

  error.textContent = '';

  try {
    const { res, data } = await postJson('/api/login', { username, password });

    if (!res.ok) {
      error.textContent = data.error || 'Login failed.';
      if (btn) { btn.disabled = false; btn.textContent = 'Log In'; }
      return;
    }

    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('username', data.username);

    window.location.href = '/terminal.html';
  } catch (e) {
    error.textContent = 'Could not reach the server.';
    if (btn) { btn.disabled = false; btn.textContent = 'Log In'; }
  }
}
