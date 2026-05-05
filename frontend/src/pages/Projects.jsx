import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderKanban, Users, CheckSquare } from "lucide-react";
import api from "../api";
import { Button, Modal, Input, Textarea, Empty, Badge, toast } from "../components/UI";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/projects")
      .then((d) => setProjects(d.projects))
      .finally(() => setLoading(false));
  }, []);

  const createProject = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const { project } = await api.post("/projects", form);
      setProjects((p) => [project, ...p]);
      setShowCreate(false);
      setForm({ name: "", description: "" });
      toast("Project created!", "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1>Projects</h1>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project
          </Button>
        </div>
      </div>

      <div className="page-body">
        {projects.length === 0 ? (
          <Empty
            icon={FolderKanban}
            title="No projects yet"
            message="Create your first project to get started"
            action={
              <Button onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>
                <Plus size={16} /> Create Project
              </Button>
            }
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {projects.map((p, i) => (
              <div
                key={p.id}
                className="project-card"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div className="project-card-name">{p.name}</div>
                  <Badge color={p.role === "admin" ? "purple" : "default"}>{p.role}</Badge>
                </div>
                <div className="project-card-desc">{p.description || "No description"}</div>
                <div className="project-card-footer">
                  <div className="project-card-stats">
                    <div className="project-stat"><Users size={12} style={{ verticalAlign: "middle", marginRight: 4 }} /><strong>{p.member_count}</strong> member{p.member_count !== 1 ? "s" : ""}</div>
                    <div className="project-stat"><CheckSquare size={12} style={{ verticalAlign: "middle", marginRight: 4 }} /><strong>{p.task_count}</strong> task{p.task_count !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <div className="form-grid">
          <Input
            label="Project name"
            placeholder="e.g. Website Redesign"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            placeholder="What is this project about?"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={creating} onClick={createProject}>Create Project</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
