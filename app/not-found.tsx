import Link from "next/link";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-12 py-16 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto space-y-6 clay-panel bg-white/80 backdrop-blur-md p-10 md:p-14 border border-border/50 ring-1 ring-black/[0.05] shadow-lg rounded-[2.5rem]">
          {/* Fun 404 Icon */}
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-primary/5">
            <span className="text-4xl">🔍</span>
          </div>
          
          <h1 className="font-heading text-6xl text-foreground font-bold tracking-tight">
            404
          </h1>
          <h2 className="text-xl font-semibold text-foreground tracking-wide">
            Oops! Strand Not Found
          </h2>
          
          <p className="text-sm text-muted-foreground leading-relaxed px-4">
            We couldn&apos;t find the artisan piece or custom strand you were looking for. 
            It might have been moved or the link is incorrect.
          </p>

          <div className="pt-6 space-y-3 flex flex-col items-center">
            <Link 
              href="/shop" 
              className="w-full bg-primary text-white text-sm font-bold uppercase tracking-wider py-4 rounded-2xl shadow-sm hover:bg-primary/90 active:scale-[0.96] flex items-center justify-center gap-2"
            >
              Browse Shop
            </Link>
            <Link 
              href="/" 
              className="w-full bg-white text-foreground text-sm font-bold uppercase tracking-wider py-4 rounded-2xl border border-border shadow-sm hover:bg-gray-50 transition-all duration-150 ease-out active:scale-[0.96] flex items-center justify-center gap-2"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
