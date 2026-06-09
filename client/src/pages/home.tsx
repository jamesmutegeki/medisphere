import { ArrowRight } from "lucide-react";
import Hero from "../components/sections/hero";
import { Link } from "react-router-dom";
import AboutPreview from "../components/sections/about-preview";
import Button from "../components/ui/button";
import Badge from "../components/ui/badge";
import { useReveal } from "../hooks/use-reveal";
import { caseStudies } from "../data/case-studies";
import PracticeAreasGrid from "../components/sections/practice-areas-grid";
import TestimonialsSection from "../components/sections/testimonials-section";
import TeamSection from "../components/sections/team-section";
import BlogPreview from "../components/sections/blog-preview";
import Newsletter from "../components/sections/newsletter";
import CTASection from "../components/sections/cta-section";
import Button from "../components/ui/button";
import Badge from "../components/ui/badge";
import { useReveal } from "../hooks/use-reveal";
import { caseStudies } from "../data/case-studies";

export default function Home() {
  return (
    <>
      <Hero />
      <AboutPreview />
      <PracticeAreasGrid />
      <CaseStudiesPreview />
      <TestimonialsSection />
      <TeamSection />
      <BlogPreview />
      <Newsletter />
      <CTASection />
    </>
  );
}

function CaseStudiesPreview() {
  const { ref, visible } = useReveal();
  const featured = caseStudies.slice(0, 2);
  return (
    <section ref={ref} className={`py-16 lg:py-24 reveal ${visible ? "visible" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Our Results</span>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-black dark:text-white mt-3">Featured Case Studies</h2>
          </div>
          <Link to="/case-studies">
            <Button variant="outline" size="sm">View All Cases</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featured.map((study) => (
            <Link
              key={study.id}
              to={`/case-studies/${study.title.toLowerCase().replace(/\s+/g, "-")}`}
              className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="overflow-hidden">
                <img src={study.image} alt={study.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-5">
                <Badge>{study.category}</Badge>
                <h3 className="font-semibold text-black dark:text-white mt-3 mb-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">{study.title}</h3>
                <p className="text-sm text-neutral-500 mb-3">{study.client}</p>
                <span className="text-sm font-medium text-black dark:text-white inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read Case Study <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
