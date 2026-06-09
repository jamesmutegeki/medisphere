import { Shield, Gavel, BookOpen, Handshake, Target, Eye } from "lucide-react";

const values = [
  { icon: Shield, title: "Excellence", desc: "We deliver the highest quality legal services through rigorous research, strategic thinking, and unwavering attention to detail." },
  { icon: Gavel, title: "Integrity", desc: "Upholding the highest ethical standards in every matter we handle, we build trust through transparency and honesty." },
  { icon: BookOpen, title: "Expertise", desc: "Our deep specialized knowledge spans all areas of corporate and commercial law, ensuring comprehensive counsel." },
  { icon: Handshake, title: "Partnership", desc: "We build lasting relationships through collaborative, client-focused service and genuine commitment to your success." },
  { icon: Target, title: "Results-Driven", desc: "Every engagement is approached with a clear focus on achieving optimal outcomes for our clients." },
  { icon: Eye, title: "Innovation", desc: "We embrace modern legal technologies and innovative approaches to deliver efficient, cost-effective solutions." },
];

export default function About() {
  return (
    <>
      <section className="bg-neutral-900 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">About Our Firm</span>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white mt-4 mb-6">
            A Legacy of Legal Excellence
          </h1>
          <p className="text-lg text-neutral-300 max-w-3xl mx-auto">
            For over two decades, CCP Digest has been at the forefront of corporate and commercial law in East Africa, providing strategic legal solutions that empower businesses to thrive.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold text-black dark:text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p>Founded in 2005 by James Mutegeki, CCP Digest began as a small practice with a vision to provide world-class corporate legal services in East Africa. Today, we are one of the region&#39;s most respected corporate and commercial law firms.</p>
                <p>Our team of 20+ attorneys brings together diverse expertise across multiple practice areas, serving clients ranging from emerging startups to Fortune 500 companies operating in the region.</p>
                <p>We are proud of our reputation for delivering innovative, practical, and commercially astute legal advice that helps our clients achieve their business objectives.</p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=450&fit=crop"
                alt="Law firm office"
                className="rounded-xl shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-black dark:text-white mb-4">Our Core Values</h2>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">The principles that guide every aspect of our practice and define who we are.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <v.icon size={24} className="text-neutral-700 dark:text-neutral-300" />
                </div>
                <h3 className="font-semibold text-black dark:text-white mb-2">{v.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
