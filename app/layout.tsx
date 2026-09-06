import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased text-gray-800" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}