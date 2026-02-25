import { createContext, useContext, useState, ReactNode } from "react";
import { languages, getTranslations, type Language, type TranslationKeys } from "./translations";

type LanguageContextType = {
  lang: Language;
  t: TranslationKeys;
  setLanguage: (code: string) => void;
  languages: Language[];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [langCode, setLangCode] = useState(() => {
    return localStorage.getItem("smarter-lang") || "en";
  });

  const lang = languages.find((l) => l.code === langCode) || languages[0];
  const t = getTranslations(langCode);

  const setLanguage = (code: string) => {
    setLangCode(code);
    localStorage.setItem("smarter-lang", code);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, setLanguage, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
