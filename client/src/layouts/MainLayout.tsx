import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/log-workout", label: "Log Workout" },
  { to: "/workout", label: "Today's Workout" },
  { to: "/ai-coach", label: "AI Coach" },
];

function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    [
      "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
      isActive
        ? "bg-white text-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.18)]"
        : "text-slate-300 hover:bg-white/10 hover:text-white",
    ].join(" ");

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink
            to="/"
            className="flex items-center gap-3"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-lg font-black text-white shadow-[0_12px_40px_rgba(34,211,238,0.35)]">
              GT
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Gym Tracker
              </p>
              <p className="text-xs text-slate-400">Train. Log. Progress.</p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-2 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClasses} end={item.to === "/"}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Logout
            </button>
            <NavLink
              to="/profile"
              className="flex h-11 items-center gap-3 rounded-full border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(59,130,246,0.12))] px-3 pr-4 text-sm font-semibold text-cyan-50 shadow-[0_10px_35px_rgba(34,211,238,0.16)] transition hover:border-cyan-300/35 hover:bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(59,130,246,0.16))] hover:text-white"
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-200">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
              <span className="bg-gradient-to-r from-white via-cyan-100 to-sky-200 bg-clip-text text-transparent">
                {user?.name || "Profile"}
              </span>
            </NavLink>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:bg-white/10 lg:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </div>

        {isMenuOpen && (
          <nav className="border-t border-white/10 bg-slate-950/95 px-4 py-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={linkClasses}
                  end={item.to === "/"}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={async () => {
                  setIsMenuOpen(false);
                  await logout();
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
              <NavLink
                to="/profile"
                className="rounded-2xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(59,130,246,0.12))] px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:border-cyan-300/35 hover:bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(59,130,246,0.16))] hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-200">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                  <span className="bg-gradient-to-r from-white via-cyan-100 to-sky-200 bg-clip-text text-transparent">
                    {user?.name || "Profile"}
                  </span>
                </div>
              </NavLink>
            </div>
          </nav>
        )}
      </header>

      <main className="pb-10">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
