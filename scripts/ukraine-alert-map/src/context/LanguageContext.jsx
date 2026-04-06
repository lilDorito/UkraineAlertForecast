import { createContext, useState, useContext, useEffect } from 'react';

const translations = {
  en: {
    appTitle: 'Ukraine Alert Forecast',
    windowDesc: '24h window (Kyiv local time)',
    info: 'Info',
    generated: 'Forecast period',
    loading: 'Loading forecast data...',
    error: 'Loading error',
    tryReload: 'Try refreshing the page',
    hourlyAvg: 'Hourly avg intensity · click or drag to jump',
    probability: 'probability',
    modelScore: 'model score',
    likelyAlert: 'Likely an alert',
    likelyNoAlert: 'Likely no alert',
    fullDataComing: 'full data coming',
    probOver24h: 'Probability over 24h',
    alertHours: 'Alert hours (binary true)',
    noAlertHours: 'No alert hours predicted',
    navigateHours: 'Navigate hours',
    aboutData: 'About Forecast Data',
    howToRead: 'How to read it?',
    dataSource: 'Data source',
    forecastFields: 'Forecast fields per region/hour',
    importantInfo: 'Important info',
    score: 'score',
    binary: 'binary',
    rawModelOutput: 'raw model output',
    calibratedLikelihood: 'calibrated alert likelihood (0–1)',
    alertFlag: 'alert flag (true if probability ≥ 0.5)',
    redPulsingWaves: 'Red pulsing waves = binary alert active for current hour',
    luhanskCrimeaNote: 'Luhansk & Crimea always show 99%+ probability as regions under full occupation and with open-ended alerts',
    probabilityRelative: 'Probability percentage is relative to daily global max score',
    learningProject: 'This is a purely learning/research project',
    sourcesList: 'Sources used to predict alerts: Telegram, Reddit, ISW, OpenMeteo, alert history',
    alertsProvider: 'Alerts data provider: https://alerts.in.ua/',
    current: 'Current',
    updateIn: 'Update in',
    dailyUpdates: 'Daily updates at 06:00 UTC',
  },
  ua: {
    appTitle: 'Прогноз тривог в Україні',
    windowDesc: '24-годинне вікно (київський час)',
    info: 'Інфо',
    generated: 'Період прогнозу',
    loading: 'Завантаження даних...',
    error: 'Помилка завантаження',
    tryReload: 'Спробуйте оновити сторінку',
    hourlyAvg: 'Середня інтенсивність за годину · клікніть або тягніть',
    probability: 'ймовірність',
    modelScore: 'оцінка моделі',
    likelyAlert: 'Ймовірна тривога',
    likelyNoAlert: 'Тривоги не очікується',
    fullDataComing: 'невдовзі дані',
    probOver24h: 'Ймовірність за 24 години',
    alertHours: 'Години тривоги (binary true)',
    noAlertHours: 'Годин тривоги не передбачено',
    navigateHours: 'Навігація годинами',
    aboutData: 'Про дані прогнозу',
    howToRead: 'Як це читати?',
    dataSource: 'Джерело даних',
    forecastFields: 'Поля прогнозу для регіону/години',
    importantInfo: 'Важлива інформація',
    score: 'оцінка',
    binary: 'бінарний',
    rawModelOutput: 'сирий вихід моделі',
    calibratedLikelihood: 'калібрована ймовірність тривоги (0–1)',
    alertFlag: 'прапорець тривоги (true, якщо ймовірність ≥ 0.5)',
    redPulsingWaves: 'Червоні пульсуючі хвилі = тривога активна в поточну годину',
    luhanskCrimeaNote: 'Луганськ та Крим завжди мають 99%+ ймовірності через повну окупацію та постійні тривоги',
    probabilityRelative: 'Відсоток ймовірності відносний до денного глобального максимального балу',
    learningProject: 'Це суто навчальний/дослідницький проект',
    sourcesList: 'Джерела для прогнозування: Telegram, Reddit, ISW, OpenMeteo, історія тривог',
    alertsProvider: 'Постачальник даних про тривоги: https://alerts.in.ua/',
    current: 'Поточний час',
    updateIn: 'Оновлення через',
    dailyUpdates: 'Щоденне оновлення о 06:00 UTC',
  },
};

const regionNamesUa = {
  Cherkasy: 'Черкаська область',
  Chernihiv: 'Чернігівська область',
  Chernivtsi: 'Чернівецька область',
  Crimea: 'Автономна Республіка Крим',
  Dnipropetrovsk: 'Дніпропетровська область',
  Donetsk: 'Донецька область',
  IvanoFrankivsk: 'Івано-Франківська область',
  Kharkiv: 'Харківська область',
  Kherson: 'Херсонська область',
  Khmelnytskyi: 'Хмельницька область',
  Kirovohrad: 'Кіровоградська область',
  Kyiv_Oblast: 'Київська область',
  Kyiv_City: 'Київ',
  Luhansk: 'Луганська область',
  Lviv: 'Львівська область',
  Mykolaiv: 'Миколаївська область',
  Odesa: 'Одеська область',
  Poltava: 'Полтавська область',
  Rivne: 'Рівненська область',
  Sumy: 'Сумська область',
  Ternopil: 'Тернопільська область',
  Zakarpattia: 'Закарпатська область',
  Vinnytsia: 'Вінницька область',
  Volyn: 'Волинська область',
  Zaporizhzhia: 'Запорізька область',
  Zhytomyr: 'Житомирська область',
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved === 'ua' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => translations[language][key] || key;
  const getRegionName = (regionKey) => {
    if (language === 'ua') {
      return regionNamesUa[regionKey] || regionKey;
    }
    if (regionKey === 'Kyiv_City') return 'Kyiv';
    if (regionKey === 'Crimea') return 'Crimea';
    let baseName = regionKey.replace(/([A-Z])/g, ' $1').trim();
    return baseName + ' region';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getRegionName }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}