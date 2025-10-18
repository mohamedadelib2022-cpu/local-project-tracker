// public/js/engineer.js
document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  if (!username || role !== 'engineer') {
    location.href = 'index.html';
    return;
  }

  document.getElementById('engineerName').textContent = `👷 ${username}`;

  const container = document.getElementById('projectsContainer');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    location.href = 'index.html';
  });

  // Load projects
  fetch('/api/projects')
    .then(res => res.json())
    .then(projects => {
      const myProjects = projects.filter(project => {
        return Object.values(project.stages).some(stage => stage.engineer === username);
      });

      if (myProjects.length === 0) {
        container.innerHTML = `<p>No projects assigned to you yet.</p>`;
        return;
      }

      myProjects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'card';

        const stageEntries = Object.entries(project.stages)
          .filter(([stageName, stage]) => stage.engineer === username)
          .map(([stageName, stage]) => {
            return `
              <div class="stage-block">
                <h4>${stageName}</h4>
                <p>Status: <strong>${stage.status}</strong></p>
                ${stage.status !== 'Done' ? `<button class="btn primary" data-id="${project.id}" data-stage="${stageName}">Mark Done</button>` : ''}
              </div>
            `;
          }).join('');

        projectDiv.innerHTML = `
          <h3>${project.name}</h3>
          <p>Client: ${project.client || '-'} - ${project.phone || '-'}</p>
          ${stageEntries}
        `;

        container.appendChild(projectDiv);
      });

      document.querySelectorAll('button[data-id]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          const stage = e.target.dataset.stage;
          e.target.disabled = true;
          e.target.textContent = "Saving...";

          const res = await fetch('/api/markDone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, stage })
          });

          if (res.ok) {
            e.target.textContent = "Done ✅";
            setTimeout(() => location.reload(), 800);
          } else {
            e.target.textContent = "Error ❌";
          }
        });
      });
    })
    .catch(err => {
      console.error('Error loading projects:', err);
      container.innerHTML = `<p>Error loading projects data.</p>`;
    });
});
