// ===== server/api.js =====
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFile = path.join(__dirname, 'data.json');

// Canonical stage names used across the app (Odoo-like pipeline)
const STAGE_NAMES = [
  'Sketch',
  '3D Design',
  'Structural',
  'Architectural',
  'Construction',
  'Government - Housing',
  'Government - Tourism',
];

function buildDefaultStages() {
  const stages = {};
  for (const name of STAGE_NAMES) {
    stages[name] = { engineer: null, status: 'Not Started' };
  }
  return stages;
}

// Ensure file exists and is valid JSON array
function ensureDataFile() {
  try {
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, '[]');
      return;
    }
    // Validate JSON
    const contents = fs.readFileSync(dataFile, 'utf8') || '[]';
    JSON.parse(contents);
  } catch {
    fs.writeFileSync(dataFile, '[]');
  }
}

function readProjects() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(dataFile, 'utf8') || '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  fs.writeFileSync(dataFile, JSON.stringify(projects, null, 2));
}

// Get all projects
router.get('/projects', (req, res) => {
  const projects = readProjects();
  res.json(projects);
});

// Add new project
router.post('/projects', (req, res) => {
  const projects = readProjects();
  const nowId = Date.now();

  // Extract allowed fields from body
  const { name, client, phone, type } = req.body || {};
  if (!name || !client || !phone || !type) {
    return res.status(400).json({ error: 'name, client, phone, and type are required' });
  }

  const newProject = {
    id: nowId,
    name,
    client,
    phone,
    type,
    createdAt: new Date().toISOString(),
    currentStage: STAGE_NAMES[0],
    stages: buildDefaultStages(),
  };
  projects.push(newProject);
  writeProjects(projects);
  res.status(201).json(newProject);
});

// Update stage / engineer / status (full or partial project update)
router.put('/projects/:id', (req, res) => {
  const projects = readProjects();
  const id = req.params.id;
  const index = projects.findIndex((p) => String(p.id) === String(id));
  if (index === -1) return res.status(404).send('Project not found');
  projects[index] = { ...projects[index], ...req.body };
  writeProjects(projects);
  res.json(projects[index]);
});

// Mark a specific stage as Done for a project
router.post('/markDone', (req, res) => {
  const { id, stage } = req.body || {};
  if (!id || !stage) {
    return res.status(400).json({ error: 'id and stage are required' });
  }

  const projects = readProjects();
  const index = projects.findIndex((p) => String(p.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  const project = projects[index];
  // Support both object and array stages structures
  if (Array.isArray(project.stages)) {
    const stageIndex = project.stages.findIndex((s) => s.name === stage);
    if (stageIndex === -1) return res.status(404).json({ error: 'Stage not found' });
    project.stages[stageIndex] = { ...project.stages[stageIndex], status: 'Done' };
  } else if (project.stages && typeof project.stages === 'object') {
    if (!project.stages[stage]) return res.status(404).json({ error: 'Stage not found' });
    project.stages[stage] = { ...project.stages[stage], status: 'Done' };
  } else {
    return res.status(400).json({ error: 'Invalid stages format' });
  }

  projects[index] = project;
  writeProjects(projects);
  return res.json({ ok: true });
});

// Delete a project
router.delete('/projects/:id', (req, res) => {
  const projects = readProjects();
  const id = String(req.params.id);
  const index = projects.findIndex((p) => String(p.id) === id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  const [removed] = projects.splice(index, 1);
  writeProjects(projects);
  res.json({ ok: true, removedId: removed.id });
});

export default router;
