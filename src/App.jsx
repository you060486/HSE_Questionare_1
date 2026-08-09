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

  // Заставку показываем при каждом открытии анкеты: это первый экран, который
  // видит работник. Ранее выбранный язык только подставляется по умолчанию.
  const savedLang = (() => {
    try {
      return localStorage.getItem(LANG_KEY);
    } catch {
      return null; // приватный режим браузера
    }
  })();
  const [lang, setLang] = useState(savedLang === 'en' ? 'en' : 'ru');
  const [needsLangChoice, setNeedsLangChoice] = useState(true);

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
