// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  const users = {
    admin: { password: "admin123", role: "admin" },
    mark: { password: "1234", role: "engineer" },
    nihal: { password: "1234", role: "engineer" },
    ahmed: { password: "1234", role: "engineer" },
    faraj: { password: "1234", role: "engineer" },
    shihab: { password: "1234", role: "engineer" },
    aisha: { password: "1234", role: "engineer" },
    nezar: { password: "1234", role: "engineer" },
    mohamed: { password: "1234", role: "engineer" }
  };

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }

    const user = users[username];
    if (!user || user.password !== password) {
      alert('Invalid username or password');
      return;
    }

    // ✅ Save login info
    localStorage.setItem('username', username);
    localStorage.setItem('role', user.role);

    // ✅ Redirect by role
    if (user.role === 'admin') {
      location.href = 'admin.html';
    } else {
      location.href = 'engineer.html';
    }
  });
});
