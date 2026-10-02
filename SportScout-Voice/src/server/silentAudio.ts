// Only positively identify digital silence in uncompressed PCM WAV.
// Other containers/codecs must be handled by the transcription provider.
export function isSilentPcmWav(base64:string):boolean{
 try{const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));if(bytes.length<44)return false;const view=new DataView(bytes.buffer);const tag=(i:number)=>String.fromCharCode(...bytes.subarray(i,i+4));if(tag(0)!=='RIFF'||tag(8)!=='WAVE')return false;let format=0,bits=0,data:Uint8Array|undefined;for(let offset=12;offset+8<=bytes.length;){const size=view.getUint32(offset+4,true),start=offset+8;if(start+size>bytes.length)return false;if(tag(offset)==='fmt '&&size>=16){format=view.getUint16(start,true);bits=view.getUint16(start+14,true);}if(tag(offset)==='data')data=bytes.subarray(start,start+size);offset=start+size+(size%2);}if(format!==1||![8,16,24,32].includes(bits)||!data?.length)return false;return data.every(value=>value===(bits===8?128:0));}catch{return false;}
}
