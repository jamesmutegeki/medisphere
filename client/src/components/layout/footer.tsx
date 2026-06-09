import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import Logo from "../logo";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const handleNewsletter = (e: FormEvent) => {
    e.preventDefault();
    if (email) setDone(true);
  };

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Logo variant="default" />
            <p className="text-sm leading-relaxed text-neutral-400">
              Your trusted legal partner in corporate and commercial law. Providing expert legal solutions with integrity, excellence, and client-focused service.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Practice Areas</h3>
            <ul className="space-y-2.5">
              {["Corporate & Commercial", "Banking & Finance", "Real Estate", "Intellectual Property", "Dispute Resolution", "Employment Law"].map((item) => (
                <li key={item}>
                  <Link to="/practice-areas" className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: "About Us", href: "/about" },
                { label: "Our Team", href: "/team" },
                { label: "Case Studies", href: "/case-studies" },
                { label: "Insights", href: "/blog" },
                { label: "Contact", href: "/contact" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Subscribe for legal insights and firm updates.
            </p>
            {done ? (
              <p className="text-sm text-emerald-400">Thank you for subscribing!</p>
            ) : (
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Newsletter email"
                />
                <button type="submit" className="p-2 rounded-lg bg-white text-neutral-900 hover:bg-neutral-200 transition-colors" aria-label="Subscribe">
                  <Send size={16} />
                </button>
              </form>
            )}

            <div className="mt-6">
              <h3 className="text-white font-semibold mb-3">Contact</h3>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-3">
                  <MapPin size={14} className="mt-0.5 text-neutral-400 shrink-0" />
                  <span className="text-sm text-neutral-400">3rd Floor, Jubilee House, Kampala</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={14} className="text-neutral-400 shrink-0" />
                  <a href="tel:+256700123456" className="text-sm text-neutral-400 hover:text-white">+256 700 123 456</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={14} className="text-neutral-400 shrink-0" />
                  <a href="mailto:info@ccpdigest.com" className="text-sm text-neutral-400 hover:text-white">info@ccpdigest.com</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} CCP Digest. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-neutral-500">
            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
