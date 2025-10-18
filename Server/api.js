// ===== server/api.js =====
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const dataFile = path.join(__dirname, "data.json");

// Ensure file exists
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));

// Get all projects
router.get("/projects", (req, res) => {
  const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  res.json(data);
});

// Add new project
router.post("/projects", (req, res) => {
  const projects = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const newProject = { ...req.body, id: Date.now() };
  projects.push(newProject);
  fs.writeFileSync(dataFile, JSON.stringify(projects, null, 2));
  res.status(201).json(newProject);
});

// Update stage / engineer / status
router.put("/projects/:id", (req, res) => {
  let projects = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const index = projects.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).send("Project not found");
  projects[index] = { ...projects[index], ...req.body };
  fs.writeFileSync(dataFile, JSON.stringify(projects, null, 2));
  res.json(projects[index]);
});

module.exports = router;
