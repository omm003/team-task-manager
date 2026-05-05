import { useState } from "react";
import { Modal, Input, Textarea, Select, Button, toast } from "./UI";
import api from "../api";

export default function TaskModal({ open, onClose, projectId, members, onCreated }) {
  const [form, setForm] = useState({
    title: "", description: "", assigned_to: "", priority: "medium", due_date: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim()) { toast("Title is required", "error"); return; }
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || undefined, due_date: form.due_date || undefined };
      const { task } = await api.post(`/projects/${projectId}/tasks`, payload);
      onCreated(task);
      setForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });
      onClose();
      toast("Task created!", "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Task">
      <div className="form-grid">
        <Input label="Title" placeholder="What needs to be done?" value={form.title} onChange={set("title")} autoFocus />
        <Textarea label="Description (optional)" placeholder="Add more details..." value={form.description} onChange={set("description")} />
        <div className="form-row">
          <Select label="Priority" value={form.priority} onChange={set("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
          <Input label="Due date (optional)" type="date" value={form.due_date} onChange={set("due_date")} />
        </div>
        <Select label="Assign to (optional)" value={form.assigned_to} onChange={set("assigned_to")}>
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={submit}>Create Task</Button>
        </div>
      </div>
    </Modal>
  );
}
