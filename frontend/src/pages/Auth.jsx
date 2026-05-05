import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Input, Button } from "../components/UI";

export default function AuthPage({ mode = "login" }) {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError("Name is required"); setLoading(false); return; }
        await signup(form.name, form.email, form.password);
      }
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="sidebar-logo-mark">
            <Zap size={16} color="white" />
          </div>
          <span className="sidebar-logo-text">TaskFlow</span>
        </div>

        <h1 className="auth-title">{isLogin ? "Welcome back" : "Create account"}</h1>
        <p className="auth-subtitle">{isLogin ? "Sign in to your workspace" : "Start managing your team's work"}</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="form-grid">
          {!isLogin && (
            <Input
              label="Full name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={set("name")}
              onKeyDown={handleKey}
              autoFocus={!isLogin}
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={set("email")}
            onKeyDown={handleKey}
            autoFocus={isLogin}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set("password")}
            onKeyDown={handleKey}
          />
          <Button size="lg" loading={loading} onClick={submit} style={{ width: "100%" }}>
            {isLogin ? "Sign in" : "Create account"}
          </Button>
        </div>

        <div className="auth-switch">
          {isLogin ? (
            <>Don't have an account? <a onClick={() => setIsLogin(false)}>Sign up</a></>
          ) : (
            <>Already have an account? <a onClick={() => setIsLogin(true)}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  );
}
