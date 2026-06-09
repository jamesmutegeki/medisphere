import { AnimatedText } from "../ui/animated-shiny-text";
import { RevealWaveImage } from "../ui/reveal-wave-image";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0 z-0">
        <RevealWaveImage
          src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=1080&fit=crop"
          className="h-full w-full"
          revealRadius={0.25}
          waveSpeed={0.3}
          waveAmplitude={0.15}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white dark:from-neutral-950/70 dark:via-neutral-950/50 dark:to-neutral-950 z-[1]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 mb-8">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Excellence in Corporate Law Since 2005
            </span>
          </div>

          <AnimatedText
            text="Corporate Commercial Practice Digest"
            gradientColors="linear-gradient(90deg, #000, #555, #000)"
            gradientAnimationDuration={3}
            hoverEffect={false}
            className="mb-8"
          />

          <p className="text-lg lg:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Your trusted partner in corporate and commercial law. Strategic legal solutions for businesses across East Africa and beyond.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-black text-white font-medium hover:bg-neutral-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Schedule a Consultation
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
            <a
              href="/practice-areas"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl border-2 border-black dark:border-white text-black dark:text-white font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Practice Areas
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20"
        >
          {[
            { label: "20+ Years Experience", desc: "Trusted legal expertise" },
            { label: "500+ Cases Won", desc: "Proven track record" },
            { label: "98% Success Rate", desc: "Client satisfaction" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4 border border-black/10 dark:border-white/10">
              <div>
                <div className="text-black dark:text-white font-semibold">{stat.label}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">{stat.desc}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
