import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Beadu | Indian Handmade Artisan Jewellery",
  description:
    "Indian handmade jewellery brand offering artisan-crafted accessories made from natural, eco-friendly materials like terracotta clay, glass, rosewood, and natural stones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn("h-full scroll-smooth antialiased font-sans")}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Quicksand:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}


