import "./globals.css";

export const metadata = {
  title: "Memoria Cromatica",
  description: "Jogo de memoria de cores com controles HSB."
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
