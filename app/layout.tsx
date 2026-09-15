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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  var file = String(e.filename || '');
                  var msg = String(e.message || '');
                  if (file.indexOf('chrome-extension://') !== -1 || msg.indexOf('M_ID') !== -1) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = String(e.reason && (e.reason.message || e.reason) || '');
                  var stack = String(e.reason && e.reason.stack || '');
                  if (reason.indexOf('M_ID') !== -1 || stack.indexOf('chrome-extension://') !== -1) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}


