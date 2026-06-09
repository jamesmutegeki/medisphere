import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Building2, Landmark, Building, Lightbulb,
  Scale, GitMerge, Users, Receipt,
  type LucideIcon,
} from "lucide-react";
import { practiceAreas } from "../data/practice-areas";
import Button from "../components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  Building2, Landmark, Building, Lightbulb,
  Scale, GitMerge, Users, Receipt,
};

function PracticeAreaDetail() {
  const { slug } = useParams();
  const area = practiceAreas.find((a) => a.slug === slug);

  if (!area) return <div className="py-20 text-center">Practice area not found.</div>;

  const Icon = iconMap[area.icon] || Scale;

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/practice-areas" className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-black mb-6">
          <ArrowLeft size={16} /> Back to Practice Areas
        </Link>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Icon size={28} className="text-neutral-700 dark:text-neutral-300" />
          </div>
          <div>
            <h1 className="font-serif text-3xl lg:text-4xl font-bold text-black dark:text-white">{area.title}</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-lg">{area.description}</p>
          </div>
        </div>
        <div className="prose prose-neutral dark:prose-invert max-w-none mt-8">
          <p>Our {area.title.toLowerCase()} practice group provides comprehensive legal services to clients across various industries. We combine deep industry knowledge with legal expertise to deliver practical, commercially sound advice.</p>
          <p>Our team has extensive experience handling complex matters in this area and is recognized for delivering exceptional results for our clients.</p>
        </div>
        <div className="mt-10">
          <Link to="/contact">
            <Button variant="primary" size="lg">Discuss Your {area.title} Needs</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function PracticeAreas() {
  const { slug } = useParams();

  if (slug) return <PracticeAreaDetail />;

  return (
    <>
      <section className="bg-neutral-900 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Our Expertise</span>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white mt-4 mb-6">Practice Areas</h1>
          <p className="text-lg text-neutral-300 max-w-3xl mx-auto">
            Comprehensive legal services across all aspects of corporate and commercial law.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {practiceAreas.map((area) => {
              const Icon = iconMap[area.icon] || Scale;
              return (
                <Link
                  key={area.id}
                  to={`/practice-areas/${area.slug}`}
                  className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon size={22} className="text-neutral-700 dark:text-neutral-300" />
                  </div>
                  <h3 className="font-semibold text-lg text-black dark:text-white mb-2">{area.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">{area.description}</p>
                  <span className="text-sm font-medium text-black dark:text-white inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn More <ArrowRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
