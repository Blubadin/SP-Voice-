import React,{createContext,useContext,useEffect,useMemo} from 'react';
import {useScout} from '../stores/ScoutContext';
import translations from './th.json';
export type UiLanguage='th'|'en';
export function translate(text:string,language:UiLanguage){if(language==='en')return text;return (translations as Record<string,string>)[text]||text;}
const LocaleContext=createContext({language:'th' as UiLanguage,t:(text:string)=>translate(text,'th')});
export function LocaleProvider({children}:{children:React.ReactNode}){const {settings}=useScout();const language=settings.uiLanguage||'th';useEffect(()=>{document.documentElement.lang=language;},[language]);const value=useMemo(()=>({language,t:(text:string)=>translate(text,language)}),[language]);return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;}
export const useLocale=()=>useContext(LocaleContext);
