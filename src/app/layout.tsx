import type { Metadata, Viewport } from "next";
import { Poppins, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin", "latin-ext"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "D2D Next Level AI",
  description: "Next Level Energy — kokpit audytorów, handlowców i managerów",
  applicationName: "NLE D2D",
  appleWebApp: { capable: true, title: "NLE D2D", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${sora.variable} ${poppins.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
