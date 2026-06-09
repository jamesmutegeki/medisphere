import { Link } from "react-router-dom";
import { Shield, Gavel, BookOpen, Handshake } from "lucide-react";
import Button from "../ui/button";

const values = [
  { icon: Shield, title: "Excellence", desc: "Delivering the highest quality legal services through rigorous research and strategic thinking." },
  { icon: Gavel, title: "Integrity", desc: "Upholding the highest ethical standards in every matter we handle." },
  { icon: BookOpen, title: "Expertise", desc: "Deep specialized knowledge across all areas of corporate and commercial law." },
  { icon: Handshake, title: "Partnership", desc: "Building lasting relationships through collaborative and client-focused service." },
];

export default function AboutPreview() {
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">About Us</span>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-black dark:text-white mt-3 mb-4">
              A Legacy of Legal Excellence
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
              Founded in 2005, CCP Digest has grown to become one of East Africa&#39;s most respected corporate and commercial law firms. Our team combines decades of experience with a forward-thinking approach to deliver innovative legal solutions.
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
              We serve a diverse client base ranging from startups to multinational corporations, providing strategic counsel across all aspects of business law.
            </p>
            <Link to="/about">
              <Button variant="primary">Learn More About Our Firm</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {values.map((v) => (
              <div key={v.title} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <v.icon size={20} className="text-neutral-700 dark:text-neutral-300" />
                </div>
                <h3 className="font-semibold text-black dark:text-white text-sm">{v.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
