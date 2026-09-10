import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import Link from "next/link";

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col items-center py-16 px-6">
        <div className="max-w-4xl w-full bg-white p-8 md:p-12 shadow-sm rounded-3xl border border-border/60 ring-1 ring-black/10">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">Return & Exchange Policy</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
              Welcome to Beadu. We want you to fall in love with your handmade jewellery and we mean it. If something isn’t quite right, we’re here to help. This Return & Exchange Policy explains how you can exchange or return a Beadu piece purchased from our online store in India.
            </p>
          </div>

          <div className="space-y-8 text-sm text-foreground/80 leading-relaxed">
            
            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">1. Our Promise to You</h2>
              <p>
                At Beadu, every item is handcrafted with care, each bead, clasp and finish made with love. We strive for perfection, but if your piece arrives damaged or is not what you ordered, we’ll make it right.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">2. Eligibility for Exchange or Return</h2>
              <div className="mb-4">
                <h3 className="font-bold text-foreground mb-2">Exchange:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Exchanges are accepted within 24 hours of delivery for non-sale items.</li>
                  <li>To initiate an exchange, mail us at <a href="mailto:beaduuu@gmail.com" className="text-primary hover:underline font-semibold">beaduuu@gmail.com</a> or on WhatsApp (+91) 9653237044 with your order number and reason for exchange.</li>
                  <li>The item must be unused, with original packaging and invoice included when returned.</li>
                  <li>You will be responsible for the return shipping cost, unless the item is damaged or incorrect.</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold text-foreground mb-2">Return (for damage or wrong item):</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>If you receive a damaged, defective, or incorrect item, please reach out within 24 hours of delivery — include photos of the parcel & unboxing video of the parcel.</li>
                  <li>Once we verify, we’ll arrange for a replacement or store credit as appropriate.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">Please note:</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Clearance, promotional or sale items are final sale and cannot be returned or exchanged, except in case of manufacturing defect.</li>
                  <li>Customised or personalized jewellery may not be eligible for return or exchange unless faulty.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">3. How the Process Works</h2>
              <ul className="list-decimal pl-5 space-y-2">
                <li>Mail our support team with your order number and reason for exchange/return. Mail us at: <a href="mailto:beaduuu@gmail.com" className="text-primary hover:underline font-semibold">beaduuu@gmail.com</a></li>
                <li>Securely pack the item (in its original packaging) and send it to: <br/>
                  <span className="font-semibold block mt-1">Beadu Returns Department (Shop No.3)</span>
                  B-3, Ground floor, Bldg no 4, Vahatuk Nagar Society,<br/>
                  Opposite Sunrise Apts, Amboli, Andheri west, Mumbai – 400058
                </li>
                <li>Once we receive the item and inspect it, we will:<br/>
                  - Approve the exchange and ship out your replacement (depending on stock)<br/>
                  - Or issue a store credit / coupon code for the value of the item, if return is approved.
                </li>
                <li>The new item or credit will be processed within 5 business days of our approval.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">4. Store Credit & Refunds</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>If a return is approved and a replacement isn’t available, we’ll issue a store credit (a unique coupon code) equivalent to the product value. This credit can be used for future purchases at Beadu.</li>
                <li>Cash refunds or bank transfers are not offered—this helps us maintain fair pricing for our handmade jewellery.</li>
                <li>Store credit will be valid for 12 months from issue and cannot be exchanged for cash.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">5. Shipping Costs & Responsibility</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>For standard exchanges or returns (where no fault lies with us), the customer is responsible for both outgoing and return shipping costs.</li>
                <li>If the item is damaged or incorrect from our end, Beadu will cover the return shipping cost.</li>
                <li>Please always use a reliable courier service and obtain tracking to ensure safe return of your parcel. Beadu is not liable for loss or damage during transit.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">6. Important Conditions & Exclusions</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>The item must be unused, unworn, and in its original condition with all tags and packaging intact.</li>
                <li>If the piece shows signs of being used, altered, or damaged by misuse, we cannot accept the return/exchange.</li>
                <li>Exchange/return requests made after the specified timeframe will not be valid.</li>
                <li>Personalized, made-to-order items, clearance items, and sale-priced jewellery are non-exchangeable and final sale unless faulty.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl text-primary mb-3">7. Order Cancellation</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>You may cancel your order only if the item has not yet shipped.</li>
                <li>Please email <a href="mailto:beaduuu@gmail.com" className="text-primary hover:underline font-semibold">beaduuu@gmail.com</a> immediately with your order number to cancel.</li>
                <li>Once the item is shipped, cancellations can’t be accepted but the usual exchange/return policy may apply if the item is faulty or incorrect.</li>
              </ul>
            </section>

            <section className="bg-primary/5 p-6 rounded-md border border-primary/10 text-center mt-8">
              <h2 className="font-heading text-2xl text-primary mb-3">8. How to Reach Us</h2>
              <p className="mb-2">If you have any questions or concerns regarding our Return & Exchange Policy, please reach out:</p>
              <div className="font-semibold text-foreground space-y-1">
                <p>Beadu – Handmade Jewellery with Love</p>
                <p>Email: <a href="mailto:beaduuu@gmail.com" className="text-primary hover:underline">beaduuu@gmail.com</a></p>
                <p>WhatsApp: (+91) 9653237044</p>
                <p>Website: <a href="https://beadu.in/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://beadu.in/</a></p>
              </div>
              <p className="mt-6 italic font-medium">Beadu — handmade jewellery with love, worn with heart. <br/> Thank you for choosing us — you deserve jewellery as unique and lovely as you are.</p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
