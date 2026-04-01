import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    "/";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_25%),linear-gradient(135deg,_#020617_0%,_#0f172a_50%,_#020617_100%)] px-4 py-5 text-white sm:px-6">
      <div className="mx-auto grid min-h-screen max-w-md content-start gap-5 py-4 lg:max-w-5xl lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8 lg:py-8">
        <div className="order-2 space-y-4 px-1 text-center lg:order-1 lg:px-0 lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Welcome Back
          </p>
          <h1 className="mx-auto max-w-sm text-3xl font-semibold leading-tight sm:text-4xl lg:mx-0 lg:max-w-xl lg:text-5xl">
            Login to continue tracking your workouts
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-6 text-slate-300 sm:text-base lg:mx-0 lg:max-w-xl lg:leading-7">
            Your dashboard, workout log, and profile history are available after login.
          </p>
        </div>

        <div className="order-1 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.4)] sm:p-6 lg:order-2 lg:p-8">
          <h2 className="text-2xl font-semibold">Login</h2>
          <p className="mt-2 text-sm text-slate-400">Use your registered account.</p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              required
            />

            {error && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-5 text-sm text-slate-400">
            <p>
              No account yet?{" "}
              <Link to="/register" className="text-cyan-300 hover:text-cyan-200">
                Create it here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
