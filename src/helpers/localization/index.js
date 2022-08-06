import React, { createContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { I18n } from "i18n-js";
import memoize from 'lodash.memoize';
import * as RNLocalize from 'react-native-localize';
import { storage } from '../storage';
import dayjs from 'dayjs';
import { useMMKVString } from 'react-native-mmkv';
import { utils } from '../utils';

const DEFAULT_LANGUAGE = 'en';


const translationGetters = {
    // lazy requires
    en: () => require('./en.json'),
    zh: () => require('./zh.json'),
    sw: () => require('./sw.json'),
    hi: () => require('./hi.json'),
};
const translations = { en: translationGetters.en() };
const i18n = new I18n(translations);
// set i18n-js config
i18n.enableFallback = true;
i18n.missingBehaviour = 'guess';
i18n.missingTranslationPrefix = 'EE: '; //'EE: ';
i18n.defaultLocale = DEFAULT_LANGUAGE;

const loadDayJsLocale = {
    // lazy requires
    sw: () => require('dayjs/locale/sw'),
    en: () => require('dayjs/locale/en'),
    zh: () => require('dayjs/locale/zh'),
    hi: () => require('dayjs/locale/hi'),
};

const translate = memoize(
    (key, config) => i18n.t(key, config),
    (key, config) => (config ? key + JSON.stringify(config) + i18n.locale : key + i18n.locale),
);
// const translate = (key, config) => i18n.t(key, config)

const setI18nConfig = (config) => {
    // fallback if no available language fits
    const fallback = { languageTag: DEFAULT_LANGUAGE, isRTL: false };
    const { languageTag, isRTL = false } = config?.languageTag ? config : (RNLocalize.findBestAvailableLanguage(Object.keys(translationGetters)) || fallback);
    // clear translation cache
    // translate.cache.clear();
    // update layout direction
    I18nManager.forceRTL(isRTL);
    const func = utils.getObject(translationGetters, languageTag, translationGetters.en);
    i18n.store({ [languageTag]: func() });
    i18n.locale = languageTag || DEFAULT_LANGUAGE;
};

export const LocalizationContext = createContext({
    i18n: {
        t: (str, opts) => translate(str, opts),
    },
    setAppLanguage: () => null,
    appLanguage: DEFAULT_LANGUAGE,
    initializeAppLanguage: () => null,
});


export const LocalizationProvider = ({ children }) => {
    const [appLanguage, setAppLanguage] = useMMKVString(storage.languageKey);
    const [_loggedUser, _setLoggedUser] = useMMKVString('authUser');
    const [loggedUser, setLoggedUser] = useState();

    useEffect(() => {
        if (_loggedUser) {
            setLoggedUser(JSON.parse(_loggedUser))
        } else {
            setLoggedUser(_loggedUser)
        }
    }, [_loggedUser])



    useEffect(() => {
        if (appLanguage) {
            i18n.locale = appLanguage;
            setI18nConfig({ languageTag: appLanguage });
            if (loadDayJsLocale[appLanguage]) {
                loadDayJsLocale[appLanguage]()
                dayjs.locale(appLanguage);
            }
        }
    }, [appLanguage]);

    const initializeAppLanguage = () => {
        const currentLanguage = storage.getLanguage();
        if (currentLanguage) {
            setAppLanguage(currentLanguage);
        } else {
            const { languageTag = DEFAULT_LANGUAGE, isRTL = false } = RNLocalize.findBestAvailableLanguage(Object.keys(translationGetters)) || {};
            setAppLanguage(languageTag);
        }
    };

    return (
        <LocalizationContext.Provider
            value={{
                i18n: {
                    t: (str, opts) => translate(str, opts),
                    getLanguage: () => i18n.locale,
                    getAvailableLanguages: () => Object.keys(translationGetters),
                    setLocale: (languageKey) => {
                        i18n.locale = languageKey;
                        return i18n;
                    },
                    i18n,
                },
                loggedUser,
                setAppLanguage,
                appLanguage,
                initializeAppLanguage,
            }}>
            {children}
        </LocalizationContext.Provider>
    );
};
