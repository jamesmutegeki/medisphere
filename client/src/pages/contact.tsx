import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import Button from "../components/ui/button";
import Input from "../components/ui/input";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <section className="bg-neutral-900 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Get in Touch</span>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white mt-4 mb-6">Contact Us</h1>
          <p className="text-lg text-neutral-300 max-w-3xl mx-auto">
            Schedule a confidential consultation with our experienced legal team.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <h2 className="font-serif text-2xl font-bold text-black dark:text-white mb-6">Send Us a Message</h2>
              {submitted ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mx-auto mb-4">
                    <Send size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200 text-lg mb-2">Message Sent Successfully!</h3>
                  <p className="text-green-600 dark:text-green-400">Our team will get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="First Name" id="firstName" placeholder="John" required />
                    <Input label="Last Name" id="lastName" placeholder="Doe" required />
                  </div>
                  <Input label="Email Address" id="email" type="email" placeholder="john@example.com" required />
                  <Input label="Phone Number" id="phone" type="tel" placeholder="+256 700 000 000" />
                  <div className="space-y-1.5">
                    <label htmlFor="practiceArea" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Practice Area Interest</label>
                    <select id="practiceArea" className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all">
                      <option value="">Select a practice area...</option>
                      <option>Corporate & Commercial</option>
                      <option>Banking & Finance</option>
                      <option>Real Estate & Property</option>
                      <option>Intellectual Property</option>
                      <option>Dispute Resolution</option>
                      <option>Employment & Labor</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Your Message</label>
                    <textarea id="message" rows={5} className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-none" placeholder="Tell us about your legal needs..." required />
                  </div>
                  <Button type="submit" variant="primary" size="lg">
                    <Send size={16} />
                    Send Message
                  </Button>
                </form>
              )}
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-black dark:text-white mb-6">Contact Information</h2>
              <div className="space-y-6">
                {[
                  { icon: MapPin, label: "Visit Us", value: "3rd Floor, Jubilee House\nKampala, Uganda" },
                  { icon: Phone, label: "Call Us", value: "+256 700 123 456", href: "tel:+256700123456" },
                  { icon: Mail, label: "Email Us", value: "info@ccpdigest.com", href: "mailto:info@ccpdigest.com" },
                  { icon: Clock, label: "Working Hours", value: "Mon - Fri: 8:00 AM - 5:00 PM\nSat: 9:00 AM - 1:00 PM" },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      <item.icon size={20} className="text-neutral-700 dark:text-neutral-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black dark:text-white">{item.label}</h3>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black transition-colors whitespace-pre-line">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 h-64 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7!2d32.6!3d0.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMTgnMDAuMCJOIDMywrAzNicwMC4wIkU!5e0!3m2!1sen!2sug!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Office Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
