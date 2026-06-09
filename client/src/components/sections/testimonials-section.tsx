import { useState } from "react";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { testimonials } from "../../data/testimonials";

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const t = testimonials;

  const next = () => setCurrent((c) => (c + 1) % t.length);
  const prev = () => setCurrent((c) => (c - 1 + t.length) % t.length);

  return (
    <section className="py-16 lg:py-24 bg-neutral-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Quote size={48} className="text-white/20 mx-auto mb-6" />
        <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-12">
          What Our Clients Say
        </h2>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {t.map((item) => (
                <div key={item.id} className="w-full shrink-0 px-4">
                  <p className="text-lg lg:text-xl text-neutral-200 leading-relaxed italic mb-8">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-full object-cover mx-auto mb-3 ring-2 ring-white/30"
                  />
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-sm text-neutral-400">{item.company}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {t.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === current ? "bg-white w-6" : "bg-white/30"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
