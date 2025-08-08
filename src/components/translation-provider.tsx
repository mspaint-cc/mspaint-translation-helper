"use client";
import React from "react";

type Translation = {
  NativeName: string;
  EnglishName: string;
};

type TranslationLocale = {
  [localeTag: string]: Translation | string;
  default: string;
};

// language tag with locale becomes
// langtag-locale
type NormalizedTranslation = {
  [languageTag: string]: Translation;
};

type Translations = {
  [languageTag: string]: TranslationLocale | Translation;
};

type TranslationContextType = {
  translations: Translations;
  normalizedTranslations: NormalizedTranslation;
  latestTranslation: Record<string, string>;
  setTranslations: (translations: Translations) => void;
  selectedLanguage: string;
  currentLanguageData: Record<string, string> | undefined;
  currentLanguageDataLoading: boolean;
  setSelectedLanguage: (selectedLanguage: string) => void;
  showNewTranslationModal: boolean;
  refresh: () => void;
  setShowNewTranslationModal: (showNewTranslationModal: boolean) => void;
  loading: boolean;
};

const TranslationContext = React.createContext<TranslationContextType>({
  translations: {
    en: {
      NativeName: "English",
      EnglishName: "English",
    },
  },
  normalizedTranslations: {
    en: {
      NativeName: "English",
      EnglishName: "English",
    },
  },
  latestTranslation: {
    "No message today... 😢": "",
  },
  loading: true,
  currentLanguageDataLoading: true,
  currentLanguageData: undefined,
  setTranslations: () => {},
  selectedLanguage: "en",
  refresh: () => {},
  setSelectedLanguage: () => {},
  showNewTranslationModal: false,
  setShowNewTranslationModal: () => {},
});

const baseURL =
  "https://raw.githubusercontent.com/mspaint-cc/translations/refs/heads/main/";

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [normalizedTranslations, setNormalizedTranslations] =
    React.useState<NormalizedTranslation>({
      en: {
        NativeName: "English",
        EnglishName: "English",
      },
    });
  const [translations, setTranslations] = React.useState<Translations>({
    en: {
      NativeName: "English",
      EnglishName: "English",
    },
  });
  const [latestTranslation, setLatestTranslation] = React.useState<
    Record<string, string>
  >({
    "No message today... 😢": "",
  });
  const [currentLanguageData, setCurrentLanguageData] = React.useState<
    Record<string, string> | undefined
  >(undefined);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [currentLanguageDataLoading, setCurrentLanguageDataLoading] =
    React.useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>("en");
  const [showNewTranslationModal, setShowNewTranslationModal] =
    React.useState<boolean>(false);
  const [refreshKey, setRefreshKey] = React.useState<number>(0);
  const [localLanguages, setLocalLanguages] = React.useState<
    Record<string, { EnglishName: string; NativeName: string }>
  >({});

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("localLanguages");
      if (raw) setLocalLanguages(JSON.parse(raw));
    } catch {}
    // We intentionally run this only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-read local languages whenever a refresh is triggered so newly-added
  // entries appear in normalizedTranslations immediately after saving.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("localLanguages");
      setLocalLanguages(raw ? JSON.parse(raw) : {});
    } catch {}
  }, [refreshKey]);

  const [internalStartupRefreshKey, setInternalStartupRefreshKey] =
    React.useState<number>(0);

  React.useEffect(() => {
    if (loading) return;
    if (typeof localStorage.getItem("selectedLanguage") === "string") {
      setSelectedLanguage(localStorage.getItem("selectedLanguage") as string);
      setInternalStartupRefreshKey(internalStartupRefreshKey + 1);
    }
  }, [loading]);

  React.useEffect(() => {
    if (internalStartupRefreshKey === 0) return;

    setCurrentLanguageDataLoading(true);
    setCurrentLanguageData(undefined);
    localStorage.setItem("selectedLanguage", selectedLanguage);

    if (selectedLanguage === "en") {
      setCurrentLanguageData(latestTranslation);
      setCurrentLanguageDataLoading(false);
      return;
    }

    fetch(
      `${baseURL}/translations/${selectedLanguage.replaceAll("-", "/")}.json`,
      {
        next: {
          revalidate: 60, // revalidate every 60 seconds
        },
      }
    ).then((response) => {
      if (response.status === 404) {
        setCurrentLanguageData(undefined);
        setCurrentLanguageDataLoading(false);
        return;
      }

      response
        .json()
        .then((data) => {
          setCurrentLanguageData(data);
          setCurrentLanguageDataLoading(false);
        })
        .catch(() => {
          // Corrupted or malformed content
          try {
            const broken = selectedLanguage;
            const raw = localStorage.getItem("localLanguages");
            if (raw) {
              const parsed = JSON.parse(raw) as Record<string, unknown>;
              if (parsed[broken]) {
                delete parsed[broken];
                localStorage.setItem("localLanguages", JSON.stringify(parsed));
              }
            }
          } catch {}
          // Fallback to English
          setSelectedLanguage("en");
          setCurrentLanguageData(latestTranslation);
          setCurrentLanguageDataLoading(false);
        });
    });
  }, [internalStartupRefreshKey]);

  React.useEffect(() => {
    const fetchData = async () => {
      const languages = await fetch(`${baseURL}/Languages.json`);
      const languagesData = await languages.json();
      setTranslations(languagesData);

      const normalizedTranslations: NormalizedTranslation = {};
      for (const languageTag in languagesData) {
        const language = languagesData[languageTag];

        if (language.Default) {
          for (const localeTag in language) {
            if (localeTag == "Default") continue;

            normalizedTranslations[languageTag + "-" + localeTag] =
              language[localeTag];
          }

          continue;
        }

        normalizedTranslations[languageTag] = language;
      }
      // Merge locally added languages/locales for global availability
      const mergedNormalized = {
        ...normalizedTranslations,
        ...(localLanguages as unknown as NormalizedTranslation),
      };
      setNormalizedTranslations(mergedNormalized);

      const latestTranslation: Record<string, string> = {};

      const latestTranslationRequest = await fetch(`${baseURL}/Template.json`);
      const latestTranslationData = await latestTranslationRequest.json();

      for (const key in latestTranslationData) {
        latestTranslation[key] = latestTranslationData[key];
      }

      setLatestTranslation(latestTranslation);

      if (selectedLanguage === "en") {
        setCurrentLanguageData(latestTranslation);
        setCurrentLanguageDataLoading(false);
        setLoading(false);
        return;
      }

      const currentLanguageData: Record<string, string> = {};
      const currentLanguageRequest = await fetch(
        `${baseURL}/translations/${selectedLanguage.replaceAll("-", "/")}.json`,
        {
          next: {
            revalidate: 60, // revalidate every 60 seconds
          },
        }
      );

      if (currentLanguageRequest.status === 404) {
        setCurrentLanguageData(undefined);
        setLoading(false);
        return;
      }

      const currentLanguageDataJSON = await currentLanguageRequest.json();
      for (const key in currentLanguageDataJSON) {
        currentLanguageData[key] = currentLanguageDataJSON[key];
      }

      setCurrentLanguageData(currentLanguageData);
      setLoading(false);
    };

    setLoading(true);
    fetchData();
  }, [refreshKey, localLanguages]);

  React.useEffect(() => {
    if (loading) return;
    setInternalStartupRefreshKey(internalStartupRefreshKey + 1);
  }, [selectedLanguage]);

  const refresh = () => {
    setRefreshKey(refreshKey + 1);
  };

  return (
    <TranslationContext.Provider
      value={{
        translations,
        setTranslations,
        selectedLanguage,
        latestTranslation,
        setSelectedLanguage,
        normalizedTranslations,
        currentLanguageDataLoading,
        currentLanguageData,
        showNewTranslationModal,
        setShowNewTranslationModal,
        loading,
        refresh,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = React.useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
