import { useState } from "react";
import { LayoutDashboard, FileText, Scale, Mail, LogOut } from "lucide-react";
import Button from "../components/ui/button";
import Input from "../components/ui/input";

type AdminView = "login" | "dashboard" | "practice-areas" | "blog" | "contacts";

export default function Admin() {
  const [view, setView] = useState<AdminView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (view === "login") {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-black dark:bg-white flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard size={28} className="text-white dark:text-black" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-black dark:text-white">Admin Login</h1>
            <p className="text-sm text-neutral-500 mt-1">Sign in to manage your content</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setView("dashboard"); }} className="space-y-4">
            <Input label="Email" id="admin-email" type="email" placeholder="admin@ccpdigest.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" id="admin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const nav = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "practice-areas" as const, label: "Practice Areas", icon: Scale },
    { id: "blog" as const, label: "Blog Posts", icon: FileText },
    { id: "contacts" as const, label: "Contact Messages", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900/50 flex">
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 p-4 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-3">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-black font-bold text-sm">CCP</span>
          </div>
          <span className="font-serif font-bold text-black dark:text-white">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                view === item.id ? "bg-neutral-100 text-black dark:bg-neutral-700 dark:text-white" : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-700"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setView("login")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="flex-1 p-6 lg:p-10">
        {view === "dashboard" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-black dark:text-white mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Practice Areas", value: "8", color: "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" },
                { label: "Blog Posts", value: "6", color: "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" },
                { label: "Team Members", value: "6", color: "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" },
                { label: "Messages", value: "12", color: "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm mt-1 opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="font-semibold text-black dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-left hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all">
                  <div className="font-medium text-sm text-black dark:text-white">Add Practice Area</div>
                  <div className="text-xs text-neutral-500 mt-1">Create a new legal practice area</div>
                </button>
                <button className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-left hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all">
                  <div className="font-medium text-sm text-black dark:text-white">New Blog Post</div>
                  <div className="text-xs text-neutral-500 mt-1">Publish a legal insight article</div>
                </button>
                <button className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-left hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all">
                  <div className="font-medium text-sm text-black dark:text-white">View Messages</div>
                  <div className="text-xs text-neutral-500 mt-1">Review contact submissions</div>
                </button>
              </div>
            </div>
          </>
        )}

        {view === "practice-areas" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-serif text-2xl font-bold text-black dark:text-white">Practice Areas</h1>
              <Button size="sm">+ Add New</Button>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="text-left p-4 font-medium text-neutral-600 dark:text-neutral-400">Title</th>
                    <th className="text-left p-4 font-medium text-neutral-600 dark:text-neutral-400">Slug</th>
                    <th className="text-left p-4 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                    <th className="text-right p-4 font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {["Corporate & Commercial", "Banking & Finance", "Real Estate & Property", "Intellectual Property"].map((name) => (
                    <tr key={name} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td className="p-4 font-medium text-black dark:text-white">{name}</td>
                      <td className="p-4 text-neutral-500">{name.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-")}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">Active</span></td>
                      <td className="p-4 text-right"><button className="text-black hover:text-neutral-600 text-sm font-medium">Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === "blog" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-serif text-2xl font-bold text-black dark:text-white">Blog Posts</h1>
              <Button size="sm">+ New Post</Button>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="text-left p-4 font-medium text-neutral-600 dark:text-neutral-400">Title</th>
                    <th className="text-left p-4 font-medium text-neutral-600 dark:text-neutral-400">Category</th>
                    <th className="text-left p-4 font-medium text-neutral-600 dark:text-neutral-400">Date</th>
                    <th className="text-right p-4 font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {["Navigating Uganda's New Data Protection Laws", "Key Considerations for Cross-Border M&A", "Understanding Shareholder Rights"].map((title) => (
                    <tr key={title} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td className="p-4 font-medium text-black dark:text-white">{title}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">Regulatory</span></td>
                      <td className="p-4 text-neutral-500">May 2026</td>
                      <td className="p-4 text-right"><button className="text-black hover:text-neutral-600 text-sm font-medium">Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === "contacts" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-black dark:text-white mb-6">Contact Messages</h1>
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <Mail size={40} className="text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No new messages yet. Contact form submissions will appear here.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
