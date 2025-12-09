import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ml' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const setLang = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const value = {
    language,
    toggleLanguage,
    setLanguage: setLang,
    isEnglish: language === 'en',
    isMalayalam: language === 'ml',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
