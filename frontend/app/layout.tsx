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
  title: "VitalCore — Salud Inteligente y Nutrición de Precisión",
  description: "Plataforma HealthTech para toda persona que cuida de su vida, su salud y su nutrición con inteligencia artificial y ciencia de datos.",
  keywords: "salud, nutrición, healthtech, longevidad, inteligencia artificial, metabolismo, biometría",
  openGraph: {
    title: "VitalCore — Salud y Nutrición de Precisión",
    description: "Cuidado de salud inteligente y nutrición adaptativa con tecnología e IA.",
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
