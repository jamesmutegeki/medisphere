import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Search, LogIn, UserPlus, User } from "lucide-react";
import { cn } from "../../lib/utils";
import Button from "../ui/button";
import SearchModal from "../sections/search-modal";
import Logo from "../logo";

const navLinks = [
  { label: "Home", href: "/" },
  {
    label: "Practice Areas",
    href: "/practice-areas",
    children: [
      { label: "Corporate & Commercial", href: "/practice-areas/corporate-commercial" },
      { label: "Banking & Finance", href: "/practice-areas/banking-finance" },
      { label: "Real Estate & Property", href: "/practice-areas/real-estate-property" },
      { label: "Intellectual Property", href: "/practice-areas/intellectual-property" },
      { label: "View All", href: "/practice-areas" },
    ],
  },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Our Team", href: "/team" },
  { label: "Insights", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="shrink-0">
              <Logo />
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setDropdown(link.label)}
                  onMouseLeave={() => setDropdown(null)}
                >
                  <Link
                    to={link.href}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-1",
                      location.pathname === link.href
                        ? "text-black bg-neutral-100 dark:text-white dark:bg-neutral-800"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-black hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {link.label}
                    {link.children && <ChevronDown size={14} className={`transition-transform duration-200 ${dropdown === link.label ? "rotate-180" : ""}`} />}
                  </Link>
                  {link.children && dropdown === link.label && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-2 animate-slide-down">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="block px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black transition-colors"
                          onClick={() => setDropdown(null)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all hover:scale-105 active:scale-95"
                aria-label="Open search"
              >
                <Search size={18} />
              </button>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <LogIn size={14} /> Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  <UserPlus size={14} /> Sign Up
                </Button>
              </Link>
            </div>

            <button
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              <button
                onClick={() => { setSearchOpen(true); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <Search size={16} /> Search
              </button>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 space-y-2">
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full"><LogIn size={14} /> Sign In</Button>
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full"><UserPlus size={14} /> Sign Up</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
