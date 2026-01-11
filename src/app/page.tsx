import CookieForm from "@/components/CookieForm";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 relative">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-hay-field.png')" }}
      ></div>
      {/* White overlay for subtle premium effect */}
      <div className="fixed inset-0 z-0 bg-white/70"></div>

      <main className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8 space-y-4">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img src="/logo.png" alt="Grower Direct" className="h-32 sm:h-40 md:h-48 w-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300" />
          </div>
        </div>

        <div className="bg-white/80 rounded-[2.5rem] shadow-2xl p-1 sm:p-2 border border-white/40 backdrop-blur-xl">
          <div className="bg-white/50 rounded-[2rem] p-6 md:p-8 border border-white/60">
            <CookieForm />
          </div>
        </div>


      </main>
    </div>
  );
}
