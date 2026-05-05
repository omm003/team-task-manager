const router = require("express").Router();
const db = require("../db/database");
const { auth } = require("../middleware/auth");

// GET /api/dashboard — stats for all projects user belongs to
router.get("/", auth, (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split("T")[0];

  const projectIds = db
    .prepare("SELECT project_id FROM project_members WHERE user_id = ?")
    .all(userId)
    .map((r) => r.project_id);

  if (projectIds.length === 0) {
    return res.json({
      total_tasks: 0,
      by_status: { todo: 0, inprogress: 0, done: 0 },
      overdue: 0,
      my_tasks: 0,
      tasks_per_user: [],
      recent_tasks: [],
    });
  }

  const placeholders = projectIds.map(() => "?").join(",");

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders})`)
    .get(...projectIds).count;

  const byStatus = db
    .prepare(`SELECT status, COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) GROUP BY status`)
    .all(...projectIds);

  const statusMap = { todo: 0, inprogress: 0, done: 0 };
  byStatus.forEach((r) => { statusMap[r.status] = r.count; });

  const overdue = db
    .prepare(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) AND due_date < ? AND status != 'done'`)
    .get(...projectIds, today).count;

  const myTasks = db
    .prepare(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) AND assigned_to = ?`)
    .get(...projectIds, userId).count;

  const tasksPerUser = db
    .prepare(`
      SELECT u.name, u.id, COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id IN (${placeholders})
      GROUP BY u.id ORDER BY task_count DESC LIMIT 10
    `)
    .all(...projectIds);

  const recentTasks = db
    .prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id IN (${placeholders})
      ORDER BY t.updated_at DESC LIMIT 8
    `)
    .all(...projectIds);

  res.json({
    total_tasks: total,
    by_status: statusMap,
    overdue,
    my_tasks: myTasks,
    tasks_per_user: tasksPerUser,
    recent_tasks: recentTasks,
  });
});

module.exports = router;
