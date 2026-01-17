import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import MobileBottomNav from "@/components/common/MobileBottomNav";

export default function SiteLayout({ children }) {
  return (
    <>
      <Header />

      {/* ✅ add bottom padding so content doesn't hide behind bottom nav */}
      <main className="min-h-screen pb-20 md:pb-0">{children}</main>

      <Footer />

      {/* ✅ mobile only */}
      <MobileBottomNav />
    </>
  );
}
