"use client";

import { useState } from "react";
import { useEcomStore } from "@/store/ecomStore";

export function ContactForm() {
  const { addToast } = useEcomStore();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      addToast("Missing Fields", "Please fill in your name, email, and message.", "warning");
      return;
    }

    setSubmitted(true);
    addToast("Message Sent!", "Thank you for reaching out to Beadu. We'll reply within 24 hours.", "success");
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <section className="py-16 bg-muted/40 font-sans border-t border-border/40">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="clay-panel bg-white p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-primary font-heading">
              Say Hello to Beadu
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl text-foreground font-normal">
              Have Questions or Custom Order Requests?
            </h2>
            <p className="text-xs text-muted-foreground">
              We&apos;d love to hear from you—your thoughts, questions, or just a little hello.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-primary/10 rounded-2xl text-center space-y-2">
              <h3 className="font-heading text-lg text-primary">Thank You!</h3>
              <p className="text-xs text-muted-foreground">
                Your message has been received. Our team will get back to you shortly!
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-bold text-primary underline pt-2"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ananya Sharma"
                    className="clay-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ananya@example.com"
                    className="clay-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="clay-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Your Message *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Ask about custom bracelet designs, bulk orders, or care tips..."
                  className="clay-input w-full resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#7c2d12] hover:bg-[#9a3412] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                Send Message to Beadu
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
