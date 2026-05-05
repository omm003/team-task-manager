import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Users, ArrowLeft, Trash2, UserPlus, Crown, UserMinus, ChevronDown } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Button, Badge, Modal, Input, Select, Confirm, Empty, toast } from "../components/UI";
import TaskModal from "../components/TaskModal";
import TaskDetail from "../components/TaskDetail";
import { differenceInDays, isPast, parseISO, format } from "date-fns";

const COLS = [
  { key: "todo", label: "To Do", color: "var(--text3)" },
  { key: "inprogress", label: "In Progress", color: "var(--accent)" },
  { key: "done", label: "Done", color: "var(--green)" },
];

const priorityColor = { low: "default", medium: "yellow", high: "red", urgent: "orange" };

function TaskCard({ task, onClick }) {
  const due = task.due_date
    ? isPast(parseISO(task.due_date)) && task.status !== "done"
      ? { cls: "due-overdue", label: format(parseISO(task.due_date), "MMM d") }
      : differenceInDays(parseISO(task.due_date), new Date()) <= 2
      ? { cls: "due-soon", label: format(parseISO(task.due_date), "MMM d") }
      : { cls: "", label: format(parseISO(task.due_date), "MMM d") }
    : null;

  const initials = task.assignee_name
    ? task.assignee_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : null;

  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <Badge color={priorityColor[task.priority]}>{task.priority}</Badge>
      </div>
      {task.description && (
        <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {task.description}
        </p>
      )}
      <div className="task-card-meta">
        {due && <span className={`${due.cls}`} style={{ fontSize: 11 }}>{due.label}</span>}
        {initials && (
          <span className="task-card-assignee" style={{ marginLeft: "auto" }}>
            <div className="avatar" style={{ width: 20, height: 20, fontSize: 9 }}>{initials}</div>
            {task.assignee_name.split(" ")[0]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("board");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberRole, setAddMemberRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/tasks`),
    ])
      .then(([projData, tasksData]) => {
        setProject(projData.project);
        setMembers(projData.members);
        setTasks(tasksData.tasks);
      })
      .catch(() => navigate("/projects"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const isAdmin = project?.role === "admin";

  const addMember = async () => {
    if (!addMemberEmail.trim()) return;
    setAddingMember(true);
    try {
      const { member } = await api.post(`/projects/${projectId}/members`, {
        email: addMemberEmail,
        role: addMemberRole,
      });
      setMembers((p) => [...p, member]);
      setAddMemberEmail("");
      toast(`${member.name} added!`, "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setAddingMember(false); }
  };

  const removeMember = async (userId) => {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      setMembers((p) => p.filter((m) => m.id !== userId));
      toast("Member removed", "success");
    } catch (e) { toast(e.message, "error"); }
  };

  const changeRole = async (userId, role) => {
    try {
      await api.patch(`/projects/${projectId}/members/${userId}/role`, { role });
      setMembers((p) => p.map((m) => m.id === userId ? { ...m, role } : m));
      toast("Role updated", "success");
    } catch (e) { toast(e.message, "error"); }
  };

  const deleteProject = async () => {
    try {
      await api.delete(`/projects/${projectId}`);
      toast("Project deleted", "success");
      navigate("/projects");
    } catch (e) { toast(e.message, "error"); }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div style={{ marginBottom: 12 }}>
          <Link to="/projects" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)" }}>
            <ArrowLeft size={14} /> Back to Projects
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1>{project?.name}</h1>
              <Badge color={isAdmin ? "purple" : "default"}>{project?.role}</Badge>
            </div>
            {project?.description && (
              <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>{project.description}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="sm" onClick={() => setShowMembers(true)}>
              <Users size={14} /> {members.length} Members
            </Button>
            {isAdmin && (
              <>
                <Button size="sm" onClick={() => setShowCreateTask(true)}>
                  <Plus size={14} /> Add Task
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmDeleteProject(true)}>
                  <Trash2 size={14} />
                </Button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <div className="tabs" style={{ margin: 0 }}>
            {["board", "list"].map((t) => (
              <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t === "board" ? "Kanban Board" : "List View"}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <select className="field-input" style={{ padding: "6px 32px 6px 10px", fontSize: 13 }}
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select className="field-input" style={{ padding: "6px 32px 6px 10px", fontSize: 13 }}
              value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="page-body">
        {tab === "board" ? (
          <div className="kanban">
            {COLS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="kanban-col">
                  <div className="kanban-col-header">
                    <span className="kanban-col-title">
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, display: "inline-block" }} />
                      {col.label}
                    </span>
                    <span className="kanban-col-count">{colTasks.length}</span>
                  </div>
                  <div className="kanban-col-body">
                    {colTasks.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text3)", fontSize: 12 }}>No tasks</div>
                    ) : colTasks.map((t) => (
                      <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {filteredTasks.length === 0 ? (
              <Empty title="No tasks found" message="Try adjusting your filters or create a new task" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredTasks.map((t) => (
                  <div key={t.id} className="task-card" onClick={() => setSelectedTask(t)}
                    style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{t.description.slice(0, 80)}{t.description.length > 80 ? "…" : ""}</div>}
                    </div>
                    <Badge color={priorityColor[t.priority]}>{t.priority}</Badge>
                    <Badge color={t.status === "todo" ? "default" : t.status === "inprogress" ? "blue" : "green"}>
                      {t.status === "todo" ? "To Do" : t.status === "inprogress" ? "In Progress" : "Done"}
                    </Badge>
                    {t.assignee_name && <span style={{ fontSize: 12, color: "var(--text2)" }}>{t.assignee_name}</span>}
                    {t.due_date && <span style={{ fontSize: 11, color: isPast(parseISO(t.due_date)) && t.status !== "done" ? "var(--red)" : "var(--text3)" }}>{format(parseISO(t.due_date), "MMM d")}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task create */}
      <TaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={projectId}
        members={members}
        onCreated={(t) => setTasks((p) => [t, ...p])}
      />

      {/* Task detail */}
      <TaskDetail
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        projectId={projectId}
        members={members}
        isAdmin={isAdmin}
        onUpdated={(updated) => {
          setTasks((p) => p.map((t) => t.id === updated.id ? updated : t));
          setSelectedTask(updated);
        }}
        onDeleted={(id) => {
          setTasks((p) => p.filter((t) => t.id !== id));
          setSelectedTask(null);
        }}
      />

      {/* Members modal */}
      <Modal open={showMembers} onClose={() => setShowMembers(false)} title="Team Members">
        <div>
          {isAdmin && (
            <div style={{ marginBottom: 20, padding: 14, background: "var(--bg3)", borderRadius: "var(--radius)" }}>
              <div className="field-label" style={{ marginBottom: 8 }}>Add member by email</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="field-input"
                  style={{ flex: 1 }}
                  placeholder="colleague@company.com"
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMember()}
                />
                <select className="field-input" style={{ width: 120 }} value={addMemberRole} onChange={(e) => setAddMemberRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button size="sm" loading={addingMember} onClick={addMember}><UserPlus size={14} /></Button>
              </div>
            </div>
          )}
          <div className="members-list">
            {members.map((m) => (
              <div key={m.id} className="member-row">
                <div className="avatar">{m.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}</div>
                <div className="member-info">
                  <div className="member-name">{m.name} {m.id === user.id ? <span style={{ fontSize: 11, color: "var(--text3)" }}>(you)</span> : ""}</div>
                  <div className="member-email">{m.email}</div>
                </div>
                <Badge color={m.role === "admin" ? "purple" : "default"}>
                  {m.role === "admin" && <Crown size={10} />} {m.role}
                </Badge>
                {isAdmin && m.id !== user.id && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button variant="ghost" size="sm" onClick={() => changeRole(m.id, m.role === "admin" ? "member" : "admin")}>
                      {m.role === "admin" ? "Demote" : "Promote"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => removeMember(m.id)}>
                      <UserMinus size={13} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Confirm
        open={confirmDeleteProject}
        onClose={() => setConfirmDeleteProject(false)}
        onConfirm={deleteProject}
        title="Delete Project"
        message={`Delete "${project?.name}" and all its tasks? This cannot be undone.`}
        danger
      />
    </>
  );
}
