import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Briefcase, Users, Settings,
  LogOut, Plus, Edit, Trash2, X, Upload, File,
  BookOpen, Scale, ChevronRight
} from "lucide-react";
import Button from "../components/ui/button";
import Logo from "../components/logo";

// ---- Types ----
interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  status: "draft" | "published";
  createdAt: string;
}
interface CaseFile {
  id: string;
  title: string;
  client: string;
  type: string;
  fileUrl: string;
  createdAt: string;
}

type Tab = "articles" | "cases" | "settings";

// ---- Sidebar ----
function Sidebar({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  const links: { tab: Tab; label: string; icon: ReactNode }[] = [
    { tab: "articles", label: "Articles", icon: <FileText size={18} /> },
    { tab: "cases", label: "Case Files", icon: <Briefcase size={18} /> },
    { tab: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4">
      <div className="mb-8">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((l) => (
          <button
            key={l.tab}
            onClick={() => setActiveTab(l.tab)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === l.tab
                ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            }`}
          >
            {l.icon} {l.label}
          </button>
        ))}
      </nav>

      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800">
          <BookOpen size={16} /> View Site
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ---- Stats Card ----
function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-black dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// ---- Article Form ----
function ArticleForm({ onSubmit, onCancel }: { onSubmit: (a: Omit<Article, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title, category, content, status });
    setTitle(""); setCategory(""); setContent(""); setStatus("draft");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-black dark:text-white flex items-center gap-2">
          <Plus size={18} /> New Article
        </h3>
        <button type="button" onClick={onCancel} className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" required
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all">
            <option value="">Select category</option>
            <option value="corporate">Corporate Law</option>
            <option value="commercial">Commercial Law</option>
            <option value="practice">Practice Notes</option>
            <option value="opinion">Legal Opinion</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Status</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStatus("draft")}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${status==="draft" ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-neutral-300 dark:border-neutral-700 text-neutral-500"}`}>Draft</button>
            <button type="button" onClick={() => setStatus("published")}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${status==="published" ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-neutral-300 dark:border-neutral-700 text-neutral-500"}`}>Published</button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Write your article content here..." required
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-y" />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary"><Plus size={16} /> {status === "published" ? "Publish" : "Save Draft"}</Button>
      </div>
    </form>
  );
}

// ---- Case File Form ----
function CaseFileForm({ onSubmit, onCancel }: { onSubmit: (c: Omit<CaseFile, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [type, setType] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, client, type, fileUrl: file ? file.name : "" });
    setTitle(""); setClient(""); setType(""); setFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-black dark:text-white flex items-center gap-2">
          <Plus size={18} /> New Case File
        </h3>
        <button type="button" onClick={onCancel} className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Case Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Uganda Telecom v. UCC" required
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Client</label>
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name"
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all">
            <option value="">Select type</option>
            <option value="civil">Civil</option>
            <option value="criminal">Criminal</option>
            <option value="commercial">Commercial</option>
            <option value="constitutional">Constitutional</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">File Upload</label>
          <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 cursor-pointer hover:border-black dark:hover:border-white transition-colors">
            <Upload size={18} className="text-neutral-400" />
            <span className="text-sm text-neutral-500">{file ? file.name : "Click to upload"}</span>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary"><Upload size={16} /> Upload Case File</Button>
      </div>
    </form>
  );
}

// ---- Articles List ----
function ArticlesList({ articles, onDelete }: { articles: Article[]; onDelete: (id: string) => void }) {
  if (!articles.length) {
    return <p className="text-neutral-400 text-sm py-8 text-center">No articles yet. Create your first one above.</p>;
  }
  return (
    <div className="space-y-2">
      {articles.map((a) => (
        <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-black dark:text-white truncate">{a.title}</h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              {a.category && <span className="font-medium">{a.category}</span>}
              {a.category && " · "}{new Date(a.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${a.status==="published" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600"}`}>
              {a.status}
            </span>
            <button onClick={() => onDelete(a.id)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Cases List ----
function CasesList({ cases, onDelete }: { cases: CaseFile[]; onDelete: (id: string) => void }) {
  if (!cases.length) {
    return <p className="text-neutral-400 text-sm py-8 text-center">No case files yet. Upload one above.</p>;
  }
  return (
    <div className="space-y-2">
      {cases.map((c) => (
        <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-black dark:text-white truncate">{c.title}</h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              {c.client} {c.type && <span className="font-medium">· {c.type}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <span className="text-[10px] text-neutral-400 flex items-center gap-1"><File size={12} /> {c.fileUrl || "No file"}</span>
            <button onClick={() => onDelete(c.id)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Dashboard Page ----
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("articles");
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [cases, setCases] = useState<CaseFile[]>([]);

  const addArticle = (data: Omit<Article, "id" | "createdAt">) => {
    setArticles((prev) => [{
      ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(),
    }, ...prev]);
    setShowArticleForm(false);
  };

  const addCase = (data: Omit<CaseFile, "id" | "createdAt">) => {
    setCases((prev) => [{
      ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(),
    }, ...prev]);
    setShowCaseForm(false);
  };

  const deleteArticle = (id: string) => setArticles((prev) => prev.filter((a) => a.id !== id));
  const deleteCase = (id: string) => setCases((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="min-h-screen flex bg-white dark:bg-neutral-950">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <Logo variant="compact" />
        <div className="flex gap-2">
          {(["articles","cases"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeTab===t ? "bg-black text-white dark:bg-white dark:text-black" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>
              {t === "articles" ? "Articles" : "Cases"}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<FileText size={18} />} label="Articles" value={articles.length} />
            <StatCard icon={<Briefcase size={18} />} label="Case Files" value={cases.length} />
            <StatCard icon={<Users size={18} />} label="Views" value="—" />
            <StatCard icon={<Scale size={18} />} label="Published" value={articles.filter((a) => a.status==="published").length} />
          </div>

          {/* Articles Tab */}
          {activeTab === "articles" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-black dark:text-white">Articles</h2>
                {!showArticleForm && (
                  <Button variant="primary" size="sm" onClick={() => setShowArticleForm(true)}>
                    <Plus size={16} /> New Article
                  </Button>
                )}
              </div>
              {showArticleForm && <ArticleForm onSubmit={addArticle} onCancel={() => setShowArticleForm(false)} />}
              <ArticlesList articles={articles} onDelete={deleteArticle} />
            </div>
          )}

          {/* Cases Tab */}
          {activeTab === "cases" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-black dark:text-white">Case Files</h2>
                {!showCaseForm && (
                  <Button variant="primary" size="sm" onClick={() => setShowCaseForm(true)}>
                    <Plus size={16} /> New Case File
                  </Button>
                )}
              </div>
              {showCaseForm && <CaseFileForm onSubmit={addCase} onCancel={() => setShowCaseForm(false)} />}
              <CasesList cases={cases} onDelete={deleteCase} />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="animate-fade-in">
              <h2 className="font-serif text-2xl font-bold text-black dark:text-white mb-6">Account Settings</h2>
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Display Name</label>
                  <input placeholder="Your name" className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                  <input type="email" placeholder="you@example.com" className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all" />
                </div>
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
