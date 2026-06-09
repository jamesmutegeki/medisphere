import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, Check } from "lucide-react";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Logo from "../components/logo";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return;
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center mx-auto mb-6">
            <Check size={28} className="text-white dark:text-black" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-black dark:text-white mb-3">Account created!</h1>
          <p className="text-neutral-500 mb-8">Welcome to CCP Digest. You can now post articles and share case files.</p>
          <Link to="/login">
            <Button variant="primary" size="lg" className="w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-neutral-900 overflow-hidden order-last">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <Logo variant="compact" className="[&_span]:text-white" />
          <div className="max-w-md">
            <h2 className="text-2xl font-serif text-white mb-4">Join our legal community</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Share insights, publish articles, and collaborate on case files with fellow legal professionals across East Africa.
            </p>
          </div>
          <p className="text-neutral-500 text-sm">&copy; {new Date().getFullYear()} CCP Digest</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-black dark:text-white">Create account</h1>
            <p className="text-neutral-500 mt-2">Join CCP Digest to start contributing.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" id="name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email" id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Phone Number" id="phone" type="tel" placeholder="+256 700 000 000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-label={showPassword ? "Hide" : "Show"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Input label="Confirm Password" id="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />

            <label className="flex items-start gap-3 mt-2">
              <input type="checkbox" required className="mt-1 rounded border-neutral-300 text-black focus:ring-black" />
              <span className="text-xs text-neutral-500">I agree to the <Link to="#" className="underline">Terms of Service</Link> and <Link to="#" className="underline">Privacy Policy</Link>.</span>
            </label>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
              <UserPlus size={16} /> Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-black dark:text-white underline underline-offset-4 hover:no-underline transition-all">
                Sign in <ArrowRight size={12} className="inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
