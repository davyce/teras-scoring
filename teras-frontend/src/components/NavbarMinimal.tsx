import { Link } from "react-router-dom";
import TerasLogo from "./TerasLogo";

export default function NavbarMinimal() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b1220]/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Logo TERAS avec tilt au survol */}
        <Link to="/" className="flex items-center gap-2">
          <TerasLogo size={28} animate="hover-tilt" className="drop-shadow-sm" />
          <span className="font-semibold tracking-wide text-slate-100 text-lg">
            TERAS
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a href="/docs" className="hover:text-white transition">
            Comment fonctionne le score
          </a>
          <Link to="/login" className="hover:text-white transition">
            Se connecter
          </Link>
          <Link
            to="/register"
            className="bg-sky-400 text-black px-3 py-1.5 rounded-md font-medium hover:bg-sky-300 transition"
          >
            Essayer gratuitement
          </Link>
        </nav>
      </div>
    </header>
  );
}
