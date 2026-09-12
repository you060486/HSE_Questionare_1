import { useEffect, useState } from 'react';
import AdminPanel from './components/AdminPanel.jsx';
import SurveyForm from './components/SurveyForm.jsx';
import LanguageSplash from './components/LanguageSplash.jsx';
import VisitorForm from './components/VisitorForm.jsx';
import CopyRow from './components/CopyRow.jsx';
import { isVisitorRoute, isCopyRoute } from './lib/route.js';

const LANG_KEY = 'vd-newcomer-lang';

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  // Тип анкеты определяется путём и считается один раз:
  // внутри страницы переходов нет, App перерисовывается только по hashchange
  const [isVisitor] = useState(() => isVisitorRoute());
  const [isCopy] = useState(() => isCopyRoute());

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
  // Страница копирования служебная: заставка выбора языка ей не нужна
  if (isCopy) return <CopyRow />;

  return (
    <>
      {isVisitor ? (
        <VisitorForm lang={lang} onLangChange={changeLang} />
      ) : (
        <SurveyForm lang={lang} onLangChange={changeLang} />
      )}
      {needsLangChoice && <LanguageSplash onChoose={chooseLang} />}
    </>
  );
}
