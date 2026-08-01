import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { getIdioma } from "@/lib/i18n"

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Gestão de Serviços",
    template: "%s · Gestão de Serviços",
  },
  description:
    "Gestão de clientes, serviços, agenda, orçamentos e finanças do seu negócio.",
  applicationName: "Gestão de Serviços",
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gestão de Serviços",
  },
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // O idioma escolhido também tem de ir para o <html lang>, para o browser
  // (corretor, tradutor, leitores de ecrã) saber em que língua está a página.
  const idioma = await getIdioma()
  return (
    <html
      lang={idioma}
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
