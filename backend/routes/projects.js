const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../db/database");
const { auth, requireProjectAdmin } = require("../middleware/auth");

// GET /api/projects — list projects for current user
router.get("/", auth, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, pm.role, u.name as creator_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    JOIN users u ON p.created_by = u.id
    WHERE pm.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json({ projects });
});

// POST /api/projects — create project
router.post("/", auth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required" });

  const id = uuidv4();
  db.prepare("INSERT INTO projects (id, name, description, created_by) VALUES (?, ?, ?, ?)").run(
    id, name, description || null, req.user.id
  );
  db.prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'admin')").run(
    id, req.user.id
  );

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  res.status(201).json({ project: { ...project, role: "admin" } });
});

// GET /api/projects/:projectId
router.get("/:projectId", auth, (req, res) => {
  const { projectId } = req.params;
  const membership = db
    .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: "Access denied" });

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM project_members pm JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `).all(projectId);

  res.json({ project: { ...project, role: membership.role }, members });
});

// DELETE /api/projects/:projectId
router.delete("/:projectId", auth, requireProjectAdmin, (req, res) => {
  db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.projectId);
  res.json({ message: "Project deleted" });
});

// POST /api/projects/:projectId/members — add member
router.post("/:projectId/members", auth, requireProjectAdmin, (req, res) => {
  const { email, role = "member" } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = db.prepare("SELECT id, name, email FROM users WHERE email = ?").get(email);
  if (!user) return res.status(404).json({ error: "User not found" });

  const existing = db
    .prepare("SELECT * FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(req.params.projectId, user.id);
  if (existing) return res.status(409).json({ error: "User already in project" });

  db.prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)").run(
    req.params.projectId, user.id, role
  );
  res.status(201).json({ member: { ...user, role } });
});

// DELETE /api/projects/:projectId/members/:userId
router.delete("/:projectId/members/:userId", auth, requireProjectAdmin, (req, res) => {
  const { projectId, userId } = req.params;
  if (userId === req.user.id) return res.status(400).json({ error: "Cannot remove yourself" });
  db.prepare("DELETE FROM project_members WHERE project_id = ? AND user_id = ?").run(projectId, userId);
  res.json({ message: "Member removed" });
});

// PATCH /api/projects/:projectId/members/:userId/role
router.patch("/:projectId/members/:userId/role", auth, requireProjectAdmin, (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  if (!["admin", "member"].includes(role)) return res.status(400).json({ error: "Invalid role" });
  db.prepare("UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?").run(role, projectId, userId);
  res.json({ message: "Role updated" });
});

module.exports = router;
