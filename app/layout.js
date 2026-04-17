export const metadata = {
  title: 'Zenvora - Hybrid Cloud AI IDE',
  description: 'Professional code execution IDE with AI assistance, available as web app and desktop application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
