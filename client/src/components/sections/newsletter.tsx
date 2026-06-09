import { useState, type FormEvent } from "react";
import { Mail, Send, CheckCircle } from "lucide-react";
import Button from "../ui/button";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <section className="py-16 lg:py-20 bg-neutral-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-6">
          <Mail size={24} className="text-white" />
        </div>
        <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">Stay Informed</h2>
        <p className="text-neutral-300 mb-8 max-w-lg mx-auto">
          Subscribe to our newsletter for the latest legal insights, regulatory updates, and firm news delivered to your inbox.
        </p>
        {subscribed ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <CheckCircle size={20} />
            <span className="font-medium">Thank you! You&apos;ve been subscribed.</span>
          </div>
        ) : (
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
              aria-label="Email for newsletter"
            />
            <Button type="submit" variant="secondary" size="md">
              <Send size={16} /> Subscribe
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
