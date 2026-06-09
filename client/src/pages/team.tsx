import { Mail, Phone } from "lucide-react";
import { attorneys } from "../data/attorneys";

export default function Team() {
  return (
    <>
      <section className="bg-neutral-900 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Our People</span>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white mt-4 mb-6">Meet Our Team</h1>
          <p className="text-lg text-neutral-300 max-w-3xl mx-auto">
            Our experienced attorneys bring together decades of legal expertise and a commitment to excellence.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {attorneys.map((attorney) => (
              <div
                key={attorney.id}
                className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={attorney.image}
                    alt={attorney.name}
                    className="w-full h-72 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-5 gap-3">
                    <a href={`mailto:${attorney.email}`} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                      <Mail size={16} className="text-black" />
                    </a>
                    <a href={`tel:${attorney.phone}`} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                      <Phone size={16} className="text-black" />
                    </a>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-black dark:text-white">{attorney.name}</h3>
                  <p className="text-sm text-neutral-500 font-medium">{attorney.title}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{attorney.specialization}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 leading-relaxed">{attorney.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
