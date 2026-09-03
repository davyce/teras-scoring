// src/components/SiteFooter.tsx
// ------------------------------------------------------------
// ✅ Footer simple, liens internes (routing côté app ok)
// ------------------------------------------------------------
export default function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 h-14 text-xs md:text-sm flex items-center justify-between text-slate-400">
        <span>© {new Date().getFullYear()} TERAS</span>
        <div className="flex gap-4">
          <a className="hover:text-slate-200" href="/privacy">Confidentialité</a>
          <a className="hover:text-slate-200" href="/terms">CGU</a>
          <a className="hover:text-slate-200" href="/contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}
