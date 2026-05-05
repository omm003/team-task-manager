const router = require("express").Router({ mergeParams: true });
const { v4: uuidv4 } = require("uuid");
const db = require("../db/database");
const { auth } = require("../middleware/auth");

function getMembership(projectId, userId) {
  return db
    .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
    .get(projectId, userId);
}

// GET /api/projects/:projectId/tasks
router.get("/", auth, (req, res) => {
  const { projectId } = req.params;
  const membership = getMembership(projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: "Access denied" });

  const { status, priority, assigned_to } = req.query;
  let query = `
    SELECT t.*, u.name as assignee_name, u.email as assignee_email,
           c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.project_id = ?
  `;
  const params = [projectId];

  if (status) { query += " AND t.status = ?"; params.push(status); }
  if (priority) { query += " AND t.priority = ?"; params.push(priority); }
  if (assigned_to) { query += " AND t.assigned_to = ?"; params.push(assigned_to); }

  query += " ORDER BY t.created_at DESC";
  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

// POST /api/projects/:projectId/tasks
router.post("/", auth, (req, res) => {
  const { projectId } = req.params;
  const membership = getMembership(projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: "Access denied" });
  if (membership.role !== "admin") return res.status(403).json({ error: "Only admins can create tasks" });

  const { title, description, assigned_to, priority = "medium", due_date } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  if (assigned_to) {
    const assigneeMember = getMembership(projectId, assigned_to);
    if (!assigneeMember) return res.status(400).json({ error: "Assignee is not a project member" });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, title, description, project_id, assigned_to, created_by, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || null, projectId, assigned_to || null, req.user.id, priority, due_date || null);

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(id);
  res.status(201).json({ task });
});

// PATCH /api/projects/:projectId/tasks/:taskId
router.patch("/:taskId", auth, (req, res) => {
  const { projectId, taskId } = req.params;
  const membership = getMembership(projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: "Access denied" });

  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND project_id = ?").get(taskId, projectId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const isAdmin = membership.role === "admin";
  const isAssignee = task.assigned_to === req.user.id;

  if (!isAdmin && !isAssignee) return res.status(403).json({ error: "Access denied" });

  const { title, description, assigned_to, priority, due_date, status } = req.body;

  // Members can only update status of their own tasks
  if (!isAdmin) {
    if (title || description || assigned_to || priority || due_date) {
      return res.status(403).json({ error: "Members can only update task status" });
    }
  }

  const updates = [];
  const params = [];

  if (status && ["todo", "inprogress", "done"].includes(status)) {
    updates.push("status = ?"); params.push(status);
  }
  if (isAdmin) {
    if (title) { updates.push("title = ?"); params.push(title); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (assigned_to !== undefined) { updates.push("assigned_to = ?"); params.push(assigned_to || null); }
    if (priority) { updates.push("priority = ?"); params.push(priority); }
    if (due_date !== undefined) { updates.push("due_date = ?"); params.push(due_date || null); }
  }

  if (updates.length === 0) return res.status(400).json({ error: "Nothing to update" });
  updates.push("updated_at = datetime('now')");
  params.push(taskId);

  db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(taskId);
  res.json({ task: updated });
});

// DELETE /api/projects/:projectId/tasks/:taskId
router.delete("/:taskId", auth, (req, res) => {
  const { projectId, taskId } = req.params;
  const membership = getMembership(projectId, req.user.id);
  if (!membership || membership.role !== "admin")
    return res.status(403).json({ error: "Admin access required" });

  db.prepare("DELETE FROM tasks WHERE id = ? AND project_id = ?").run(taskId, projectId);
  res.json({ message: "Task deleted" });
});

module.exports = router;
