import { Header } from "@/components";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Full-width content for chat */}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
