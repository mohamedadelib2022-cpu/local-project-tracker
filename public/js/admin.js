// ===== admin.js =====

// عناصر الصفحة
const form = document.getElementById("addProjectForm");
const projectList = document.getElementById("projectList");

// تحميل المشاريع من localStorage
let projects = JSON.parse(localStorage.getItem("projects")) || [];

// حفظ المشاريع
function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

// عرض المشاريع في الصفحة
function renderProjects() {
  projectList.innerHTML = "";
  projects.forEach((p, i) => {
    const card = document.createElement("div");
    card.classList.add("project-card");
    card.innerHTML = `
      <h3>${p.name} (${p.type})</h3>
      <p><strong>العميل:</strong> ${p.client}</p>
      <p><strong>الهاتف:</strong> ${p.phone}</p>

      <div class="stage-container">
        ${renderStages(p.stages || {})}
      </div>

      <button onclick="deleteProject(${i})" class="delete-btn">🗑️ حذف المشروع</button>
    `;
    projectList.appendChild(card);
  });
}

// عرض مراحل المشروع
function renderStages(stages) {
  const stageNames = [
    "Sketch",
    "3D Design",
    "Structural",
    "Architectural",
    "Construction",
    "Government - Housing",
    "Government - Tourism",
  ];

  return stageNames
    .map((name) => {
      const s = stages[name] || { engineer: "غير معين", status: "لم يبدأ" };
      return `
        <div class="stage">
          <h4>${name}</h4>
          <p>المهندس: ${s.engineer}</p>
          <p>الحالة: ${s.status}</p>
        </div>
      `;
    })
    .join("");
}

// إضافة مشروع جديد
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("projectName").value.trim();
  const client = document.getElementById("clientName").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const type = document.getElementById("projectType").value.trim();

  if (!name || !client || !phone || !type) {
    alert("الرجاء إدخال جميع البيانات");
    return;
  }

  const newProject = {
    name,
    client,
    phone,
    type,
    stages: {}, // لاحقًا ممكن نحفظ حالة كل مرحلة
  };

  projects.push(newProject);
  saveProjects();
  renderProjects();
  form.reset();
});

// حذف مشروع
function deleteProject(index) {
  if (confirm("هل أنت متأكد من حذف هذا المشروع؟")) {
    projects.splice(index, 1);
    saveProjects();
    renderProjects();
  }
}

// تحميل أولي
renderProjects();
