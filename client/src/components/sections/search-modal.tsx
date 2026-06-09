import { useState, useRef, useEffect } from "react";
import { Search, X, ArrowRight, FileText, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { practiceAreas } from "../../data/practice-areas";
import { blogPosts } from "../../data/blog";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.addEventListener("keydown", (e) => e.key === "Escape" && onClose());
    }
    return () => document.removeEventListener("keydown", (e) => e.key === "Escape");
  }, [open, onClose]);

  const q = query.toLowerCase().trim();
  const results = q
    ? [
        ...practiceAreas
          .filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
          .map((a) => ({ type: "practice-area" as const, title: a.title, desc: a.description, href: `/practice-areas/${a.slug}`, icon: Scale })),
        ...blogPosts
          .filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
          .map((p) => ({ type: "article" as const, title: p.title, desc: p.excerpt, href: `/blog/${p.slug}`, icon: FileText })),
      ]
    : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-2xl mx-auto mt-20 px-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <div className="flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800">
            <Search size={20} className="text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search practice areas, articles..."
              className="flex-1 bg-transparent text-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
              aria-label="Search query"
            />
            <kbd className="hidden sm:inline-flex px-2 py-1 text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">ESC</kbd>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Close search">
              <X size={18} className="text-neutral-500" />
            </button>
          </div>
          {q && (
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="text-center py-8 text-neutral-500">No results found for &quot;{query}&quot;</p>
              ) : (
                results.map((r, i) => (
                  <Link
                    key={`${r.type}-${i}`}
                    to={r.href}
                    onClick={onClose}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                      <r.icon size={16} className="text-neutral-700 dark:text-neutral-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-black dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">{r.title}</div>
                      <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{r.desc}</div>
                    </div>
                    <ArrowRight size={14} className="text-neutral-300 group-hover:text-black mt-1 shrink-0 transition-colors" />
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
