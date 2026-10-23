import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage, fieldErrors } from "../lib/api";
import { usePageTitle } from "../components/Layout";

const safeReturn = (r) => (r && r.startsWith("/") && !r.startsWith("//") ? r : null);

function AuthShell({ title, children, footer }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-10">
      <h1 className="mb-6 text-4xl">{title}</h1>
      <div className="panel p-6">{children}</div>
      <p className="mt-4 text-center text-ink-muted">{footer}</p>
    </div>
  );
}

export function Login() {
  usePageTitle("Connexion");
  const { login, user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const back = safeReturn(params.get("retour"));

  if (user) return <Navigate to={back || (user.role === "admin" ? "/admin" : "/compte")} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email, password);
      navigate(back || (u.role === "admin" ? "/admin" : "/compte"), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Connexion"
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to={`/inscription${back ? `?retour=${encodeURIComponent(back)}` : ""}`} className="font-semibold text-brand-deep underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-danger/10 p-3 text-danger" role="alert">
            {error}
          </p>
        )}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Mot de passe
          </label>
          <input id="password" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-primary w-full py-3" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </AuthShell>
  );
}

export function Register() {
  usePageTitle("Créer un compte");
  const { register, user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const back = safeReturn(params.get("retour"));

  if (user) return <Navigate to={back || "/compte"} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});
    if (form.password.length < 8) {
      setErrors({ password: "8 caractères minimum." });
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, phone: form.phone.replace(/\s/g, "") });
      navigate(back || "/compte", { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const field = (k, label, props = {}) => (
    <div>
      <label className="label" htmlFor={k}>
        {label}
      </label>
      <input id={k} className="input" value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <p className="mt-1 text-sm text-danger">{errors[k]}</p>}
    </div>
  );

  return (
    <AuthShell
      title="Créer un compte"
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link to="/connexion" className="font-semibold text-brand-deep underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && !Object.keys(errors).length && (
          <p className="rounded-md bg-danger/10 p-3 text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("firstName", "Prénom", { autoComplete: "given-name", required: true })}
          {field("lastName", "Nom", { autoComplete: "family-name", required: true })}
        </div>
        {field("email", "Email", { type: "email", autoComplete: "email", required: true })}
        {field("phone", "Téléphone (facultatif)", { type: "tel", autoComplete: "tel", placeholder: "0551 23 45 67" })}
        {field("password", "Mot de passe", { type: "password", autoComplete: "new-password", required: true, minLength: 8 })}
        <button className="btn-primary w-full py-3" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>
    </AuthShell>
  );
}
