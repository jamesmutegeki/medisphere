import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import Button from "../ui/button";

export default function CTASection() {
  return (
    <section className="py-16 lg:py-24 bg-neutral-50 dark:bg-neutral-900/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl lg:text-4xl font-bold text-black dark:text-white mb-4">
          Ready to Work with Us?
        </h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
          Schedule a confidential consultation with our experienced legal team. We&#39;ll help you navigate your legal challenges with confidence.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/contact">
            <Button variant="primary" size="lg">
              Schedule a Consultation
              <ArrowRight size={18} />
            </Button>
          </Link>
          <a href="tel:+256700123456">
            <Button variant="outline" size="lg">
              <Phone size={18} />
              +256 700 123 456
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
