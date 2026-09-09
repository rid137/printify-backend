import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { Providers } from "@/components/providers";
import { THEME_KEY } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-hero",
});

export const metadata: Metadata = {
  title: {
    default: "Printify — Skip the print queue",
    template: "%s · Printify",
  },
  description:
    "Upload documents, pay online, and pick up finished prints when they are ready.",
};

const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_KEY)});
    var dark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-canvas font-sans text-ink-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
