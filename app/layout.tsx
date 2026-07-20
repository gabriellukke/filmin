import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://filmin.gabrielalmeidadev.com"),
  title: "Filmin",
  description: "Create and share movie lists with friends.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Filmin",
    description: "Create and share movie lists with friends.",
    siteName: "Filmin",
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Filmin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Filmin",
    description: "Create and share movie lists with friends.",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
