import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import { attorneys } from "../../data/attorneys";
import Button from "../ui/button";

export default function TeamSection() {
  const featured = attorneys.slice(0, 4);
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Our People</span>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-black dark:text-white mt-3 mb-4">
            Meet Our Team
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Our experienced attorneys combine deep legal knowledge with practical business insight to deliver exceptional results.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((attorney, i) => (
            <div
              key={attorney.id}
              className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={attorney.image}
                  alt={attorney.name}
                  className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-2">
                  <a href={`mailto:${attorney.email}`} className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                    <Mail size={14} className="text-black" />
                  </a>
                  <a href={`tel:${attorney.phone}`} className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                    <Phone size={14} className="text-black" />
                  </a>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-black dark:text-white">{attorney.name}</h3>
                <p className="text-sm text-neutral-500 font-medium">{attorney.title}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{attorney.specialization}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/team">
            <Button variant="outline" size="lg">View All Attorneys</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
