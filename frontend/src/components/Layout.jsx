import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, History, Cloud } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans">
      <aside className="w-64 bg-slate-900 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-700">
          <Cloud className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold leading-tight">AWS Deployment Assistant</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <History className="w-5 h-5" />
            <span className="font-medium">History</span>
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
