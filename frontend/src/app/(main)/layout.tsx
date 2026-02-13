import Navbar from "@/components/layout/navbar";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </AuthGuard>
  );
}
