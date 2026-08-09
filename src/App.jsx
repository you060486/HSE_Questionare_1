import { useEffect, useState } from 'react';
import AdminPanel from './components/AdminPanel.jsx';
import SurveyForm from './components/SurveyForm.jsx';
import LanguageSplash from './components/LanguageSplash.jsx';

const LANG_KEY = 'vd-newcomer-lang';

export default function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Язык: если человек уже выбирал его в этом браузере, заставку не показываем
  const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
  const [lang, setLang] = useState(savedLang === 'en' ? 'en' : 'ru');
  const [needsLangChoice, setNeedsLangChoice] = useState(!savedLang);

  const chooseLang = (value) => {
    setLang(value);
    setNeedsLangChoice(false);
    try {
      localStorage.setItem(LANG_KEY, value);
    } catch {
      /* приватный режим браузера — просто не запоминаем */
    }
  };

  const changeLang = (value) => {
    setLang(value);
    try {
      localStorage.setItem(LANG_KEY, value);
    } catch {
      /* игнорируем */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  if (hash === '#/admin') return <AdminPanel />;

  return (
    <>
      <SurveyForm lang={lang} onLangChange={changeLang} />
      {needsLangChoice && <LanguageSplash onChoose={chooseLang} />}
    </>
  );
}
