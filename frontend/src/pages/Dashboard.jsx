import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, AlertTriangle, User, ArrowRight } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/UI";
import { format, isPast, parseISO } from "date-fns";

const statusLabel = { todo: "To Do", inprogress: "In Progress", done: "Done" };
const statusColor = { todo: "default", inprogress: "blue", done: "green" };
const priorityColor = { low: "default", medium: "yellow", high: "red", urgent: "orange" };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get("/dashboard")
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  const stats = data || {};
  const completion = stats.total_tasks > 0
    ? Math.round(((stats.by_status?.done || 0) / stats.total_tasks) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1>Dashboard</h1>
            <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
              Good to see you, {user?.name?.split(" ")[0]} 👋
            </p>
          </div>
          <Link to="/projects">
            <button className="btn btn-secondary btn-sm">
              <ArrowRight size={14} /> View Projects
            </button>
          </Link>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value">{stats.total_tasks || 0}</div>
            <div className="progress-bar" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${completion}%` }} />
            </div>
            <div className="stat-sub" style={{ marginTop: 6 }}>{completion}% complete</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: "var(--accent)" }}>
              {stats.by_status?.inprogress || 0}
            </div>
            <div className="stat-sub">active tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overdue</div>
            <div className="stat-value" style={{ color: stats.overdue > 0 ? "var(--red)" : "var(--text)" }}>
              {stats.overdue || 0}
            </div>
            <div className="stat-sub">need attention</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">My Tasks</div>
            <div className="stat-value" style={{ color: "var(--green)" }}>
              {stats.my_tasks || 0}
            </div>
            <div className="stat-sub">assigned to me</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Recent Tasks */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Recent Tasks</h3>
              <Clock size={16} style={{ color: "var(--text3)" }} />
            </div>
            {(stats.recent_tasks || []).length === 0 ? (
              <p style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No tasks yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(stats.recent_tasks || []).map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg3)", borderRadius: "var(--radius)" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{t.project_name}</div>
                    </div>
                    <Badge color={statusColor[t.status]}>{statusLabel[t.status]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks per User */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Team Workload</h3>
              <User size={16} style={{ color: "var(--text3)" }} />
            </div>
            {(stats.tasks_per_user || []).length === 0 ? (
              <p style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No assigned tasks yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(stats.tasks_per_user || []).map((u) => {
                  const pct = u.task_count > 0 ? Math.round((u.done_count / u.task_count) * 100) : 0;
                  const initials = u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>{u.done_count}/{u.task_count}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status breakdown */}
          <div className="card">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Status Overview</h3>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "To Do", key: "todo", color: "var(--text3)", icon: Clock },
                { label: "In Progress", key: "inprogress", color: "var(--accent)", icon: AlertTriangle },
                { label: "Done", key: "done", color: "var(--green)", icon: CheckCircle },
              ].map(({ label, key, color, icon: Icon }) => (
                <div key={key} style={{ flex: 1, padding: "16px 12px", background: "var(--bg3)", borderRadius: "var(--radius)", textAlign: "center" }}>
                  <Icon size={20} style={{ color, margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 24, fontFamily: "var(--font-display)", fontWeight: 800, color }}>
                    {stats.by_status?.[key] || 0}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
