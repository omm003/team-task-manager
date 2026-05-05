import { useState } from "react";
import { Trash2, User, Calendar, Flag } from "lucide-react";
import { Modal, Select, Button, Input, Textarea, Badge, Confirm, toast } from "./UI";
import api from "../api";
import { format, isPast, parseISO, differenceInDays } from "date-fns";

const statusLabel = { todo: "To Do", inprogress: "In Progress", done: "Done" };
const priorityColor = { low: "default", medium: "yellow", high: "red", urgent: "orange" };

export default function TaskDetail({ task, onClose, projectId, members, isAdmin, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...task });
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!task) return null;

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const updateStatus = async (status) => {
    try {
      const { task: updated } = await api.patch(`/projects/${projectId}/tasks/${task.id}`, { status });
      onUpdated(updated);
      toast("Status updated", "success");
    } catch (e) { toast(e.message, "error"); }
  };

  const saveEdits = async () => {
    setLoading(true);
    try {
      const { task: updated } = await api.patch(`/projects/${projectId}/tasks/${task.id}`, form);
      onUpdated(updated);
      setEditing(false);
      toast("Task updated", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const deleteTask = async () => {
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}`);
      onDeleted(task.id);
      onClose();
      toast("Task deleted", "success");
    } catch (e) { toast(e.message, "error"); }
  };

  const dueDisplay = () => {
    if (!task.due_date) return null;
    const d = parseISO(task.due_date);
    const diff = differenceInDays(d, new Date());
    if (task.status === "done") return { label: format(d, "MMM d, yyyy"), cls: "" };
    if (isPast(d)) return { label: `Overdue · ${format(d, "MMM d")}`, cls: "due-overdue" };
    if (diff <= 2) return { label: `Due soon · ${format(d, "MMM d")}`, cls: "due-soon" };
    return { label: format(d, "MMM d, yyyy"), cls: "" };
  };

  const due = dueDisplay();

  return (
    <>
      <Modal open={!!task} onClose={onClose} title={editing ? "Edit Task" : task.title}>
        {editing ? (
          <div className="form-grid">
            <Input label="Title" value={form.title} onChange={set("title")} />
            <Textarea label="Description" value={form.description || ""} onChange={set("description")} />
            <div className="form-row">
              <Select label="Priority" value={form.priority} onChange={set("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
              <Select label="Status" value={form.status} onChange={set("status")}>
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </Select>
            </div>
            <Input label="Due date" type="date" value={form.due_date || ""} onChange={set("due_date")} />
            <Select label="Assignee" value={form.assigned_to || ""} onChange={set("assigned_to")}>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button loading={loading} onClick={saveEdits}>Save Changes</Button>
            </div>
          </div>
        ) : (
          <div>
            {task.description && (
              <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{task.description}</p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              <Badge color={priorityColor[task.priority]}>
                <Flag size={11} /> {task.priority}
              </Badge>
              {due && <span style={{ fontSize: 12, color: "var(--text2)" }} className={due.cls}><Calendar size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{due.label}</span>}
              {task.assignee_name && (
                <span style={{ fontSize: 12, color: "var(--text2)" }}>
                  <User size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{task.assignee_name}
                </span>
              )}
              <span style={{ fontSize: 12, color: "var(--text3)" }}>by {task.creator_name}</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="field-label" style={{ marginBottom: 8 }}>Status</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["todo", "inprogress", "done"].map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${task.status === s ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => updateStatus(s)}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit Task</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Confirm
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteTask}
        title="Delete Task"
        message={`Delete "${task.title}"? This cannot be undone.`}
        danger
      />
    </>
  );
}
