import "./globals.css";

export const metadata = {
  title: "Perception Lab",
  description: "Mini jogos de memoria, tempo e percepcao."
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
