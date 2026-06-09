import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Lightbulb, Target } from "lucide-react";
import { caseStudies } from "../data/case-studies";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";

function CaseStudyDetail() {
  const { slug } = useParams();
  const study = caseStudies.find((s) => s.title.toLowerCase().replace(/\s+/g, "-") === slug);
  if (!study) return <div className="py-20 text-center">Case study not found.</div>;

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/case-studies" className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-black mb-6">
          <ArrowLeft size={16} /> Back to Case Studies
        </Link>
        <img src={study.image} alt={study.title} className="w-full h-64 lg:h-80 object-cover rounded-xl mb-8" loading="lazy" />
        <Badge>{study.category}</Badge>
        <div className="flex items-center gap-3 text-sm text-neutral-500 mt-3 mb-2">
          <Calendar size={14} /> {study.year}
        </div>
        <h1 className="font-serif text-3xl lg:text-4xl font-bold text-black dark:text-white mb-2">{study.title}</h1>
        <p className="text-neutral-500 font-medium mb-8">Client: {study.client}</p>

        <div className="space-y-8">
          {[
            { icon: Target, label: "The Challenge", content: study.challenge, color: "text-neutral-700 bg-neutral-100 dark:bg-neutral-800" },
            { icon: Lightbulb, label: "Our Approach", content: study.approach, color: "text-neutral-700 bg-neutral-100 dark:bg-neutral-800" },
            { icon: CheckCircle, label: "The Result", content: study.result, color: "text-neutral-700 bg-neutral-100 dark:bg-neutral-800" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-6 ${s.color}`}>
              <div className="flex items-center gap-2 mb-3">
                <s.icon size={20} />
                <h2 className="font-semibold text-lg">{s.label}</h2>
              </div>
              <p className="leading-relaxed opacity-90">{s.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-black dark:text-white mb-2">Outcome</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{study.outcome}</p>
        </div>

        <div className="mt-10 text-center">
          <Link to="/contact"><Button variant="primary" size="lg">Discuss Your Case</Button></Link>
        </div>
      </div>
    </section>
  );
}

export default function CaseStudies() {
  const { slug } = useParams();
  if (slug) return <CaseStudyDetail />;

  return (
    <>
      <section className="bg-neutral-900 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Our Results</span>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white mt-4 mb-6">Case Studies</h1>
          <p className="text-lg text-neutral-300 max-w-3xl mx-auto">Real results from our client engagements across practice areas.</p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {caseStudies.map((study) => (
              <Link
                key={study.id}
                to={`/case-studies/${study.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="overflow-hidden">
                  <img src={study.image} alt={study.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge>{study.category}</Badge>
                    <span className="text-xs text-neutral-400">{study.year}</span>
                  </div>
                  <h3 className="font-semibold text-black dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">{study.title}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{study.client}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">{study.challenge}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-black dark:text-white mt-3 group-hover:gap-2 transition-all">
                    Read Case Study <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
