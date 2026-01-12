import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import WidePatti from "@/components/store/WidePatti";


export default function SiteLayout({ children }) {
  return (
    <>
      <Header />
      {/* <WidePatti /> */}
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
