export const metadata = {
  title: 'Zenvora',
  description: 'Code execution IDE',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
