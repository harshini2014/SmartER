import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const LanguageSelector = () => {
  const { lang, setLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-sm font-medium text-foreground active:scale-95 transition-transform"
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span>{lang.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto rounded-xl bg-popover border border-border shadow-lg z-50">
          <div className="py-1">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLanguage(l.code); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-accent transition-colors ${
                  l.code === lang.code ? "bg-accent/50" : ""
                }`}
              >
                <div>
                  <p className="font-semibold text-foreground">{l.nativeName}</p>
                  <p className="text-xs text-muted-foreground">{l.name}</p>
                </div>
                {l.code === lang.code && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
