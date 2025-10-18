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
  projects.forEach((p) => {
    const card = document.createElement('div');
    card.classList.add('project-card');
    card.innerHTML = `
      <div class="project-header">
        <div>${p.name} (${p.type}) — <small>${p.client} · ${p.phone}</small></div>
        <div>
          <button class="delete-btn" data-id="${p.id}">🗑️ حذف</button>
        </div>
      </div>
      <div class="stage-container" data-project-id="${p.id}">
        ${renderStages(p)}
      </div>
    `;
    projectList.appendChild(card);
  });

  bindDeleteButtons();
  bindAssignSelects();
  enableDragAndDrop();
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

function enableDragAndDrop() {
  // Each .stage is draggable; dragging between positions just reorders visual,
  // but we interpret drop to advance status among [Not Started -> In Progress -> Done]
  const stages = document.querySelectorAll('.stage');
  stages.forEach((el) => {
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        projectId: el.getAttribute('data-project-id'),
        stage: el.getAttribute('data-stage')
      }));
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
  });

  const containers = document.querySelectorAll('.stage-container');
  containers.forEach((container) => {
    container.addEventListener('dragover', (e) => e.preventDefault());
    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      const payload = e.dataTransfer.getData('text/plain');
      if (!payload) return;
      const { projectId, stage } = JSON.parse(payload);

      // Toggle/advance status when dropped anywhere in the same project
      const projects = await fetchProjects();
      const project = projects.find(p => String(p.id) === String(projectId));
      if (!project) return;
      const stageData = project.stages?.[stage] || { status: 'Not Started', engineer: null };
      const nextStatus = stageData.status === 'Not Started' ? 'In Progress' : (stageData.status === 'In Progress' ? 'Done' : 'Not Started');
      project.stages[stage] = { ...stageData, status: nextStatus };

      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: project.stages })
      });
      await renderProjects();
    });
  });
}

// تحميل أولي
renderProjects();
