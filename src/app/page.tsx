import CookieForm from "@/components/CookieForm";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4 md:p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-200 via-gray-100 to-gray-100"></div>

      <main className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8 space-y-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Grower Direct Logo" className="h-32 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Order Form
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Secure your hay today.
          </p>
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
