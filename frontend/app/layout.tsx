import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ChatCoach from "@/components/ChatCoach";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VitalCore — Tu Plataforma de Bienestar Integral",
  description: "Nutrición personalizada, entrenamiento inteligente, meditación guiada y comunidad. Vive tu mejor versión con IA.",
  keywords: "bienestar, nutrición, entrenamiento, meditación, IA, salud",
  openGraph: {
    title: "VitalCore",
    description: "Vive tu mejor versión con IA",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <ChatCoach />
      </body>
    </html>
  );
}
