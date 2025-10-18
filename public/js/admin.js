// ===== admin.js =====

// عناصر الصفحة
const form = document.getElementById('addProjectForm');
const projectList = document.getElementById('projectList');

const STAGE_NAMES = [
  'Sketch',
  '3D Design',
  'Structural',
  'Architectural',
  'Construction',
  'Government - Housing',
  'Government - Tourism',
];

const ENGINEERS = [
  'mark',
  'nihal',
  'ahmed',
  'faraj',
  'shihab',
  'aisha',
  'nezar',
  'mohamed',
];

function stageCardTemplate(projectId, stageName, stageData) {
  const engineer = stageData?.engineer || 'غير معين';
  const status = stageData?.status || 'Not Started';
  return `
    <div class="stage"
         draggable="true"
         data-project-id="${projectId}"
         data-stage="${stageName}">
      <h4>${stageName}</h4>
      <p>المهندس: <strong>${engineer}</strong></p>
      <p>الحالة: <strong>${status}</strong></p>
      <label>تعيين مهندس:</label>
      <select class="assign-select" data-project-id="${projectId}" data-stage="${stageName}">
        <option value="">-- اختر مهندس --</option>
        ${ENGINEERS.map(e => `<option value="${e}" ${e===engineer? 'selected':''}>${e}</option>`).join('')}
      </select>
    </div>
  `;
}

async function fetchProjects() {
  const res = await fetch('/api/projects');
  return await res.json();
}

function renderStages(project) {
  const stages = project.stages || {};
  return STAGE_NAMES.map((name) => stageCardTemplate(project.id, name, stages[name])).join('');
}

async function renderProjects() {
  const projects = await fetchProjects();
  projectList.innerHTML = '';

  // Build Kanban columns by stage name
  STAGE_NAMES.forEach((stageName) => {
    const column = document.createElement('div');
    column.className = 'kanban-column';
    column.innerHTML = `
      <h3>${stageName}</h3>
      <div class="kanban-dropzone" data-stage="${stageName}"></div>
    `;
    projectList.appendChild(column);
  });

  // Place each project as a card into its current stage column
  projects.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('draggable', 'true');
    card.dataset.id = String(p.id);

    // Engineer assignment UI tied to current stage
    const currentStage = p.currentStage || STAGE_NAMES[0];
    const stageData = (p.stages || {})[currentStage] || { engineer: null, status: 'Not Started' };

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <strong>${p.name}</strong>
        <button class="delete-btn" data-id="${p.id}">🗑️</button>
      </div>
      <div style="font-size:12px;color:#334155;">${p.client} · ${p.phone} · ${p.type}</div>
      <div style="margin-top:6px;">
        <div style="font-size:12px;">الحالة: <strong>${stageData.status}</strong></div>
        <label style="font-size:12px;">تعيين مهندس:</label>
        <select class="assign-select" data-project-id="${p.id}" data-stage="${currentStage}">
          <option value="">-- اختر مهندس --</option>
          ${ENGINEERS.map(e => `<option value="${e}" ${e===(stageData.engineer||'')? 'selected':''}>${e}</option>`).join('')}
        </select>
      </div>
    `;

    const dropzone = projectList.querySelector(`.kanban-dropzone[data-stage="${currentStage}"]`);
    dropzone?.appendChild(card);
  });

  bindDeleteButtons();
  bindAssignSelects();
  enableKanbanDnD();
}

// إضافة مشروع جديد عبر API
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('projectName').value.trim();
  const client = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const type = document.getElementById('projectType').value.trim();

  if (!name || !client || !phone || !type) {
    alert('الرجاء إدخال جميع البيانات');
    return;
  }

  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, client, phone, type })
  });
  if (!res.ok) {
    alert('حدث خطأ أثناء إضافة المشروع');
    return;
  }
  await renderProjects();
  form.reset();
});

function bindDeleteButtons() {
  document.querySelectorAll('.delete-btn[data-id]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await renderProjects();
      } else {
        alert('تعذر حذف المشروع');
      }
    });
  });
}

function bindAssignSelects() {
  document.querySelectorAll('select.assign-select').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const select = e.currentTarget;
      const projectId = select.getAttribute('data-project-id');
      const stage = select.getAttribute('data-stage');
      const engineer = select.value || null;

      // Fetch project, update specific stage engineer, save via PUT
      const projects = await fetchProjects();
      const project = projects.find(p => String(p.id) === String(projectId));
      if (!project) return;
      project.stages = project.stages || {};
      const currentStage = project.stages[stage] || { status: 'Not Started', engineer: null };
      project.stages[stage] = { ...currentStage, engineer };

      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: project.stages })
      });
      await renderProjects();
    });
  });
}

function enableKanbanDnD() {
  const cards = document.querySelectorAll('.kanban-card');
  cards.forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.id || '');
    });
  });

  document.querySelectorAll('.kanban-dropzone').forEach((zone) => {
    zone.addEventListener('dragover', (e) => e.preventDefault());
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      const projectId = e.dataTransfer.getData('text/plain');
      if (!projectId) return;
      const targetStage = zone.getAttribute('data-stage');

      const projects = await fetchProjects();
      const project = projects.find(p => String(p.id) === String(projectId));
      if (!project) return;

      // When moved, set currentStage to target, keep engineer/status of that stage
      project.currentStage = targetStage;
      project.stages = project.stages || {};
      project.stages[targetStage] = project.stages[targetStage] || { engineer: null, status: 'In Progress' };

      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStage: targetStage, stages: project.stages })
      });
      await renderProjects();
    });
  });
}

// تحميل أولي
renderProjects();
