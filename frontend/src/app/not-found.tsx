import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { NotFoundContent } from "@/components/feedback/not-found";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
    </div>
  );
}
