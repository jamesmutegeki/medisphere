import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Logo from "../components/logo";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: integrate with auth API
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <Logo variant="compact" className="[&_span]:text-white" />
          <div className="max-w-md">
            <blockquote className="text-2xl font-serif text-white leading-relaxed mb-6">
              &ldquo;Justice is the constant and perpetual will to render to everyone their due.&rdquo;
            </blockquote>
            <p className="text-neutral-400 text-sm">&mdash; Justinian I</p>
          </div>
          <p className="text-neutral-500 text-sm">&copy; {new Date().getFullYear()} CCP Digest. All rights reserved.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-black dark:text-white">Welcome back</h1>
            <p className="text-neutral-500 mt-2">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link to="#" className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors">Forgot password?</Link>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              <LogIn size={16} /> Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-medium text-black dark:text-white underline underline-offset-4 hover:no-underline transition-all">
                Create one <ArrowRight size={12} className="inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
