// Session credentials live in memory only and disappear on reload.
const keys:{gemini?:string;deepgram?:string}={};
export function rememberSessionKey(provider:'gemini'|'deepgram',key:string){keys[provider]=key;}
export function apiFetch(input:string,init:RequestInit={}) {
  const headers=new Headers(init.headers);
  if(keys.gemini)headers.set('x-scout-gemini-key',keys.gemini);
  if(keys.deepgram)headers.set('x-scout-deepgram-key',keys.deepgram);
  return fetch(input,{...init,headers});
}
