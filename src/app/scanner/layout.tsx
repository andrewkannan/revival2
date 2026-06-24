export const metadata = {
  title: 'Revival Scanner',
  description: 'Scanner application for Revival 2026 check-in',
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}
