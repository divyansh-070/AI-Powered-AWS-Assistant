import { NavLink, Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, History, Cloud, Activity, Plus } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-zinc-950 font-sans text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between select-none">
        <div>
          {/* Header Branding */}
          <div className="p-5 flex items-center gap-3 border-b border-zinc-800/80">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">AWS Assistant</h1>
              <p className="text-[11px] text-zinc-400">Cloud Architecture Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-3">
            {/* New Idea Primary Action Button */}
            <Link
              to="/?new=true"
              className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              <span>New Idea</span>
            </Link>

            <nav className="space-y-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white font-medium border border-zinc-700/60'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white font-medium border border-zinc-700/60'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`
                }
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Footer Status */}
        <div className="p-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-medium text-zinc-300">System Ready</span>
            </div>
            <Activity className="w-3.5 h-3.5 text-zinc-500" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-zinc-950 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
