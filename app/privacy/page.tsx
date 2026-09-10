import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col items-center py-16 px-6">
        <div className="max-w-4xl w-full bg-white p-8 md:p-12 shadow-sm rounded-3xl border border-border/60 ring-1 ring-black/10">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
              Welcome to Beadu, where every piece of handmade jewellery carries love, care, and creativity. Protecting your privacy is an essential part of our promise. This Privacy Policy explains how we collect, use, and safeguard your personal data when you explore our online jewellery store in India, browse our handmade creations, or make a purchase from our website.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto mt-4">
              By using our site, you agree to the practices described below, designed to ensure transparency and build lasting trust with every Beadu customer.
            </p>
          </div>

          <div className="space-y-8 text-sm text-foreground/80 leading-relaxed">
            
            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">1. Information We Collect</h2>
              <p className="mb-2">
                At Beadu, we collect only the information necessary to provide you with a smooth, personalized shopping experience. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Personal details like your name, email address, phone number, billing and shipping address.</li>
                <li>Payment information (processed securely through trusted gateways).</li>
                <li>Optional preferences such as wishlists or product favorites.</li>
                <li>Non-personal data like browser type, IP address, and device information to help us improve your browsing experience.</li>
              </ul>
              <p className="mt-2">
                This helps us make your handmade jewellery shopping journey at Beadu seamless and special.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">2. How We Use Your Information</h2>
              <p className="mb-2">
                Your information is used only to serve you better. Beadu uses the collected data to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Process and fulfil your orders safely and efficiently.</li>
                <li>Provide shipping and delivery updates.</li>
                <li>Send you newsletters, offers, and product updates (only with your consent).</li>
                <li>Enhance our website experience for smoother online jewellery shopping.</li>
                <li>Improve customer support and tailor product recommendations.</li>
              </ul>
              <p className="mt-2">
                At Beadu, every detail you share helps us make your journey more personalised because handmade jewellery deserves a handmade experience.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">3. Cookies and Tracking Technologies</h2>
              <p className="mb-2">
                Beadu uses cookies to give you a better experience when browsing our jewellery store online. Cookies help us remember your login details, track items in your cart, and show you relevant designs based on your interests.
              </p>
              <p>
                You can manage or disable cookies in your browser settings, though this may affect certain website features such as product recommendations or account login.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">4. Sharing Your Information</h2>
              <p className="mb-2">
                Your trust matters most. Beadu never sells or trades your personal data. However, we may share limited information with:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Trusted service providers (like shipping and payment partners) who help us operate smoothly.</li>
                <li>Legal authorities, only if required by law or to protect Beadu’s rights and users’ safety.</li>
                <li>Business partners during transitions such as mergers or acquisitions, ensuring privacy standards remain consistent.</li>
              </ul>
              <p className="mt-2">
                We choose partners who align with our ethics and value customer data protection as deeply as we do.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">5. External Links</h2>
              <p>
                Our website may include links to other jewellery brands, blogs, or social media platforms. Please note that Beadu isn’t responsible for their content or privacy practices. When you leave our site, we encourage you to review the privacy policy of that platform to ensure your data is protected everywhere you go.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">6. Data Security and Protection</h2>
              <p className="mb-2">
                We take your privacy seriously. Beadu’s online jewellery store uses secure servers, encrypted payment gateways, and advanced security practices to protect your personal data. We regularly update our systems to maintain the highest level of security, ensuring your handmade jewellery shopping experience remains worry-free and safe.
              </p>
              <p>
                When you shop at Beadu, you’re not just choosing artisanal design you’re choosing trust, transparency, and safety.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">7. Your Privacy Rights</h2>
              <p className="mb-2">
                We believe you should have full control over your personal information. You can:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Unsubscribe from promotional emails anytime.</li>
                <li>Manage cookie preferences in your browser settings.</li>
                <li>Contact us directly for any privacy-related concerns.</li>
              </ul>
              <p className="mt-2">
                We’re here to ensure your experience with Beadu is comfortable, secure, and tailored to your preferences.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">8. Updates to This Policy</h2>
              <p className="mb-2">
                Beadu may occasionally update this Privacy Policy to align with new regulations or business improvements. We encourage you to revisit this page periodically to stay informed about how your data is protected. The “Last Updated” date will reflect the most recent revisions.
              </p>
              <p>
                Transparency and honesty guide everything we do both in craftsmanship and in customer care.
              </p>
            </section>

            <section className="bg-primary/5 p-6 rounded-md border border-primary/10 text-center mt-8">
              <h2 className="font-heading text-2xl text-primary mb-3">9. Contact Us</h2>
              <p className="mb-2">If you have any questions or concerns regarding this Privacy Policy or your personal data, please reach out to us:</p>
              <div className="font-semibold text-foreground space-y-1">
                <p>Beadu — Handmade Jewellery with Love</p>
                <p>Email: <a href="mailto:beaduuu@gmail.com" className="text-primary hover:underline">beaduuu@gmail.com</a></p>
                <p>Website: <a href="https://beadu.in/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://beadu.in/</a></p>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
