import { Link } from "react-router-dom";
import {
  Building2, Landmark, Building, Lightbulb,
  Scale, GitMerge, Users, Receipt, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { practiceAreas } from "../../data/practice-areas";
import { useReveal } from "../../hooks/use-reveal";

const iconMap: Record<string, LucideIcon> = {
  Building2, Landmark, Building, Lightbulb,
  Scale, GitMerge, Users, Receipt,
};

function AreaCard({ area, index }: { area: typeof practiceAreas[0]; index: number }) {
  const { ref, visible } = useReveal<HTMLAnchorElement>();
  const Icon = iconMap[area.icon] || Scale;

  return (
    <Link
      ref={ref}
      to={`/practice-areas/${area.slug}`}
      className={`group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:-translate-y-1 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all duration-300 ${visible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
        <Icon size={22} className="text-neutral-700 dark:text-neutral-300" />
      </div>
      <h3 className="font-semibold text-black dark:text-white mb-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200">
        {area.title}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 line-clamp-3">
        {area.description}
      </p>
      <span className="text-sm font-medium text-black dark:text-white inline-flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
        Learn More <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
  );
}

export default function PracticeAreasGrid() {
  const { ref: titleRef, visible: titleVisible } = useReveal();

  return (
    <section className="py-16 lg:py-24 bg-neutral-50 dark:bg-neutral-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className={`text-center max-w-2xl mx-auto mb-12 lg:mb-16 reveal ${titleVisible ? "visible" : ""}`}>
          <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">What We Do</span>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-black dark:text-white mt-3 mb-4">
            Our Practice Areas
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Comprehensive legal services tailored to meet the complex needs of businesses across multiple sectors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {practiceAreas.map((area, i) => (
            <AreaCard key={area.id} area={area} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
