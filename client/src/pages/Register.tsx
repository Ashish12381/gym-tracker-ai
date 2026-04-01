import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_25%),linear-gradient(135deg,_#020617_0%,_#0f172a_50%,_#020617_100%)] px-4 py-5 text-white sm:px-6">
      <div className="mx-auto grid min-h-screen max-w-md content-start gap-5 py-4 lg:max-w-5xl lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8 lg:py-8">
        <div className="order-2 space-y-4 px-1 text-center lg:order-1 lg:px-0 lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Create Account
          </p>
          <h1 className="mx-auto max-w-sm text-3xl font-semibold leading-tight sm:text-4xl lg:mx-0 lg:max-w-xl lg:text-5xl">
            Create your account and start tracking your workouts
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-6 text-slate-300 sm:text-base lg:mx-0 lg:max-w-xl lg:leading-7">
            After registration, you’ll be able to log workouts, review your profile history, and access protected pages.
          </p>
        </div>

        <div className="order-1 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.4)] sm:p-6 lg:order-2 lg:p-8">
          <h2 className="text-2xl font-semibold">Register</h2>
          <p className="mt-2 text-sm text-slate-400">Create your personal account.</p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              required
            />
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
              {submitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <div className="mt-5 text-sm text-slate-400">
            Already registered?{" "}
            <Link to="/login" className="text-cyan-300 hover:text-cyan-200">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
