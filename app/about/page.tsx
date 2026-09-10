import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import Image from "next/image";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col items-center py-16 px-6">
        <div className="max-w-4xl w-full bg-white p-8 md:p-12 shadow-sm rounded-3xl border border-border/60 ring-1 ring-black/10">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">Our Story</h1>
            <h2 className="font-heading text-2xl text-primary/80 mb-6">Handmade Jewellery Store in India | About Us</h2>
          </div>

          <div className="space-y-6 text-sm text-foreground/80 leading-relaxed">
            
            <p>
              Beadu is a thoughtfully curated handmade jewellery store in India, where every piece is crafted with love, care, and deep creative intention. Rooted in artistry and emotion, Beadu believes that jewellery is more than just an accessory — it is a personal expression, a reflection of individuality, and a celebration of everyday beauty. Each design tells a story, lovingly handcrafted by skilled Indian artisans who transform simple materials into meaningful, wearable art.
            </p>

            <p>
              At Beadu, we specialise in handmade jewellery made from eco-friendly and natural materials such as wood, glass, and clay. Our creations highlight the beauty of imperfection — a gentle reminder that handmade pieces are unique, just like the people who wear them. From cute wooden earrings and colourful glass bracelets to handcrafted clay keychains, trinket trays, and decorative magnets, every product reflects patience, authenticity, and soulful craftsmanship.
            </p>

            <p>
              Our jewellery is designed for comfort as much as style. Lightweight wooden earrings, soft glass-beaded bracelets, and smooth clay accessories make Beadu jewellery perfect for all-day wear. The earthy warmth of wood, the playful shimmer of glass, and the artistic charm of clay come together to create pieces that feel gentle on the skin and kind to the planet. As a sustainable handmade jewellery brand in India, we consciously choose materials and methods that support slow fashion and mindful living.
            </p>

            <p>
              Beadu proudly stands for inclusivity and self-expression. Our handmade jewellery collection is created for everyone — regardless of age, body type, or personal style. Whether you love minimal designs, earthy tones, vibrant colours, or playful aesthetics, Beadu offers jewellery that resonates with your personality. Our range includes wooden earrings, handmade bracelets, clay jewellery, keychains, trinket trays, and magnets, designed to add joy to both your wardrobe and living spaces.
            </p>

            <p>
              For those seeking something truly personal, Beadu also offers custom handmade jewellery in India. You can collaborate with us to design a one-of-a-kind piece that reflects your emotions, memories, or creative ideas. From personalised bracelets and earrings to custom keychains and trinket trays, we love turning your vision into a handcrafted keepsake.
            </p>

            <p>
              Shopping at Beadu is a heartfelt experience. As an online handmade jewellery store in India, we focus on making every interaction warm and meaningful. Each order is carefully packed with love and attention, ensuring that what reaches you feels personal and special. Whether you’re browsing jewellery online for everyday wear or searching for a thoughtful handmade gift, Beadu ensures quality, care, and authenticity in every package.
            </p>

            <p>
              Beyond jewellery, Beadu also creates charming handmade lifestyle accessories. Our wooden keychains, clay trinket trays, and decorative magnets are perfect for gifting or adding a touch of handmade beauty to your home. These small yet meaningful pieces reflect the same love and craftsmanship that define our jewellery collections.
            </p>

            <p>
              Beadu is more than just a handmade jewellery store — it is a growing community that values creativity, sustainability, and conscious choices. As more people in India embrace slow fashion and ethical shopping, Beadu continues to be a trusted name for those who seek handmade jewellery online in India that feels personal, joyful, and soulful.
            </p>

            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/15 ring-1 ring-primary/10 text-center my-8">
              <p className="font-heading text-2xl text-primary mb-2">
                At Beadu, we believe that when something is handmade with love, it’s worn with heart. 💛
              </p>
              <p className="text-foreground font-medium">
                Explore our handmade jewellery and accessories and discover pieces that celebrate craftsmanship, creativity, and the beauty of being uniquely you.
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-border/60 ring-1 ring-black/5">
              <p className="text-center font-medium text-foreground mb-4">
                We post most of our product unboxing videos and some cute creative DIY ideas on our Insta handle, do check it out.
              </p>
              <a 
                href="https://www.instagram.com/beaduuuu?igsh=MW9hdzBmNjN4N2Jkdw%3D%3D&utm_source=qr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-transform duration-150 ease-out active:scale-[0.96] shadow-sm font-semibold"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Follow us on Instagram
              </a>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
