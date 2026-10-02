import {SportType} from '../../types/scout';
export type SpeechErrorCode='permission_denied'|'no_microphone'|'device_disconnected'|'microphone_failure'|'network_error'|'no_speech'|'aborted'|'unknown';
export interface SpeechError {code:SpeechErrorCode;message:string}
export interface SpeechCallbacks {onInterimTranscript?:(text:string)=>void;onFinalTranscript?:(text:string)=>void;onAudioLevel?:(level:number)=>void;onError?:(error:SpeechError)=>void;onStart?:()=>void;onEnd?:()=>void;onNoSpeech?:()=>void}
export interface SpeechResult {finalTranscript:string;durationMs:number;audio?:Blob;provider:string;warning?:string;needsReview?:boolean}
export class FailedRecording extends Error {constructor(message:string,public audio:Blob,public durationMs:number){super(message);}}
export interface ISpeechProvider {start(callbacks:SpeechCallbacks,deviceId?:string):Promise<boolean>;stop():Promise<SpeechResult>;setLanguage(lang:'th'|'en'):void;setSport(sport:SportType):void;getProviderName():string;isCapturing():boolean}
export class SpeechCaptureProvider implements ISpeechProvider {
 private stream:MediaStream|null=null;private recorder:MediaRecorder|null=null;private chunks:Blob[]=[];private audioDone:Promise<Blob>|null=null;
 private recognition:any=null;private recognitionDone:Promise<void>|null=null;private resolveRecognition:(()=>void)|null=null;
 private context:AudioContext|null=null;private analyser:AnalyserNode|null=null;private raf:number|null=null;
 private maxRms=0;private measuredSamples=0;private generation=0;private capturing=false;private starting:Promise<boolean>|null=null;private stopPromise:Promise<SpeechResult>|null=null;
 private language:'th'|'en'='th';private mode:'auto'|'browser'|'server'='auto';private serverAvailable=false;private sensitivity='normal';private sport:SportType='badminton';
 private callbacks:SpeechCallbacks={};private began=0;private finalText='';private interim='';private recognitionError='';private provider='Browser Speech Recognition';
 setLanguage(lang:'th'|'en'){this.language=lang;}setSport(sport:SportType){this.sport=sport;}
 configure(config:{serverAvailable:boolean;mode?:'auto'|'browser'|'server';sensitivity?:string}){this.serverAvailable=config.serverAvailable;this.mode=config.mode||'auto';this.sensitivity=config.sensitivity||'normal';}
 getProviderName(){return this.provider;}isCapturing(){return this.capturing;}
 async start(callbacks:SpeechCallbacks,deviceId?:string):Promise<boolean>{
 if(this.capturing||this.starting)return false;const generation=++this.generation;this.stopPromise=null;this.callbacks=callbacks;this.chunks=[];this.finalText='';this.interim='';this.recognitionError='';this.maxRms=0;this.measuredSamples=0;
 if(typeof navigator==='undefined'||!navigator.mediaDevices?.getUserMedia){callbacks.onError?.({code:'microphone_failure',message:'ไม่พบการเข้าถึงไมโครโฟน กรุณาเปิดด้วย Chrome/Safari ผ่าน HTTPS / Microphone unavailable; use a secure supported browser.'});return false;}
 const work=async()=>{
 try{
 const stream=await navigator.mediaDevices.getUserMedia({audio:deviceId&&deviceId!=='default'?{deviceId:{exact:deviceId},echoCancellation:true,noiseSuppression:true,autoGainControl:true}:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
 if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return false;}this.stream=stream;this.capturing=true;this.began=Date.now();
 const Rec=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
 const server=this.mode==='server'||this.mode==='auto'&&this.serverAvailable;
 if(server&&!this.serverAvailable)throw Error('ยังไม่ได้ตั้งค่า API สำหรับถอดเสียง / Server transcription needs an API key.');
 if(!Rec&&!server)throw Error('เบราว์เซอร์นี้ไม่รองรับถอดเสียง เปิดใน Chrome หรือเชื่อมต่อ Gemini API / Browser speech unsupported; use Chrome or configure Gemini.');
 this.provider=server?'Gemini recorded-audio transcription':'Browser Speech Recognition';
 if(typeof MediaRecorder!=='undefined'){
 const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported(m));
 this.recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
 this.audioDone=new Promise((resolve,reject)=>{this.recorder!.ondataavailable=e=>{if(e.data.size)this.chunks.push(e.data);};this.recorder!.onstop=()=>resolve(new Blob(this.chunks,{type:this.recorder?.mimeType||mime||'audio/webm'}));this.recorder!.onerror=()=>reject(Error('บันทึกเสียงไม่สำเร็จ / Audio recording failed.'));});
 this.recorder.start(250);
 }else if(server)throw Error('เบราว์เซอร์ไม่รองรับการบันทึกเสียง / MediaRecorder unavailable.');
 try{const Ctx=window.AudioContext||(window as any).webkitAudioContext;this.context=new Ctx();await this.context!.resume();const source=this.context!.createMediaStreamSource(stream);this.analyser=this.context!.createAnalyser();this.analyser.fftSize=512;source.connect(this.analyser);this.meter();}catch{/* Recording/recognition may still function without a level meter. */}
 if(generation!==this.generation){this.cleanup();return false;}
 if(Rec){
 this.recognition=new Rec();this.recognition.lang=this.language==='th'?'th-TH':'en-US';this.recognition.interimResults=true;this.recognition.continuous=true;
 this.recognitionDone=new Promise(resolve=>{this.resolveRecognition=resolve;});
 this.recognition.onresult=(event:any)=>{let interim='';for(let i=event.resultIndex;i<event.results.length;i++){const text=event.results[i][0].transcript;if(event.results[i].isFinal)this.finalText+=`${this.finalText?' ':''}${text.trim()}`;else interim+=text;}this.interim=interim;this.callbacks.onInterimTranscript?.(`${this.finalText} ${interim}`.trim());};
 this.recognition.onend=()=>this.resolveRecognition?.();
 this.recognition.onerror=(event:any)=>{this.recognitionError=event.error||'unknown';this.resolveRecognition?.();if(!server&&['not-allowed','service-not-allowed','audio-capture','network'].includes(event.error))this.callbacks.onError?.({code:event.error==='not-allowed'?'permission_denied':'network_error',message:`บริการถอดเสียงของเบราว์เซอร์ผิดพลาด (${event.error}) / Browser recognition error. Try server transcription.`});};
 try{this.recognition.start();}catch(e){this.resolveRecognition?.();if(!server)throw e;}
 }
 this.callbacks.onStart?.();return true;
 }catch(err:any){this.cleanup();this.capturing=false;const denied=err.name==='NotAllowedError',missing=err.name==='NotFoundError';this.callbacks.onError?.({code:denied?'permission_denied':missing?'no_microphone':'microphone_failure',message:denied?'ไม่ได้รับอนุญาตใช้ไมโครโฟน โปรดอนุญาตในเบราว์เซอร์ / Microphone permission denied.':missing?'ไม่พบไมโครโฟนที่เลือก / Selected microphone not found.':err.message||'ไม่สามารถเปิดไมโครโฟน / Microphone failed.'});return false;}
 };
 this.starting=work();try{return await this.starting;}finally{this.starting=null;}
 }
 private meter(){if(!this.analyser||!this.capturing)return;const values=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(values);const rms=Math.sqrt(values.reduce((sum,n)=>sum+n*n,0)/values.length);this.maxRms=Math.max(this.maxRms,rms);this.measuredSamples++;const gain=this.sensitivity==='high'?500:this.sensitivity==='low'?150:300;this.callbacks.onAudioLevel?.(Math.min(100,Math.round(rms*gain)));this.raf=requestAnimationFrame(()=>this.meter());}
 async stop():Promise<SpeechResult>{
 if(this.stopPromise)return this.stopPromise;
 const work=async()=>{
 ++this.generation;
 // Cancels a permission/startup request safely. Its eventually returned stream is closed.
 if(this.starting&&!this.capturing){this.capturing=false;this.callbacks.onEnd?.();return {finalTranscript:'',durationMs:0,provider:this.provider};}
 const durationMs=this.began?Math.max(0,Date.now()-this.began):0;this.capturing=false;
 const server=this.mode==='server'||this.mode==='auto'&&this.serverAvailable;
 try{
 if(this.recorder?.state==='recording')this.recorder.stop();
 if(this.recognition){try{this.recognition.stop();}catch{this.resolveRecognition?.();}}
 // stop() results arrive asynchronously. Keep handlers attached until end or bounded timeout.
 if(this.recognitionDone)await Promise.race([this.recognitionDone,new Promise<void>(resolve=>setTimeout(resolve,1800))]);
 const audio=this.audioDone?await this.audioDone:undefined;
 const nativeText=`${this.finalText} ${this.interim}`.trim();
 this.cleanup();let finalTranscript=nativeText;
 if(server&&this.measuredSamples>5&&this.maxRms===0){finalTranscript='';}
 else if(server&&this.mode==='auto'&&this.finalText.trim()&&!this.recognitionError){finalTranscript=this.finalText.trim();this.provider='Browser final transcript (automatic)';}
 else if(server){if(!audio||!audio.size)throw Error('ไม่ได้บันทึกเสียง กรุณาพูดอีกครั้ง / No recorded audio.');try{finalTranscript=await transcribeAudio(audio,this.language);}catch(error:any){if(this.finalText.trim()){const warning='Gemini ถอดเสียงไม่สำเร็จ ใช้ข้อความที่เบราว์เซอร์ถอดได้ กรุณาตรวจทาน / Gemini unavailable; browser transcript requires review.';this.callbacks.onFinalTranscript?.(this.finalText.trim());this.callbacks.onEnd?.();return {finalTranscript:this.finalText.trim(),durationMs,audio,provider:'Browser Speech Recognition fallback',warning,needsReview:true};}throw new FailedRecording(error.message||'ถอดเสียงไม่สำเร็จ',audio,durationMs);}}
 if(!server&&!nativeText&&this.recognitionError)throw Error(`ถอดเสียงไม่สำเร็จ (${this.recognitionError}) เปิด Chrome หรือใช้ Gemini API / Speech recognition failed.`);
 this.callbacks.onFinalTranscript?.(finalTranscript);if(!finalTranscript)this.callbacks.onNoSpeech?.();this.callbacks.onEnd?.();return {finalTranscript,durationMs,audio,provider:this.provider};
 }catch(err){this.cleanup();this.callbacks.onEnd?.();throw err;}
 };
 this.stopPromise=work();return this.stopPromise;
 }
 private cleanup(){if(this.raf!==null)cancelAnimationFrame(this.raf);this.raf=null;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;if(this.context&&this.context.state!=='closed')void this.context.close().catch(()=>{});this.context=null;this.analyser=null;if(this.recognition){this.recognition.onresult=null;this.recognition.onerror=null;this.recognition.onend=null;try{this.recognition.abort();}catch{}}this.recognition=null;this.recorder=null;this.audioDone=null;this.recognitionDone=null;this.callbacks.onAudioLevel?.(0);}
}
export async function transcribeAudio(audio:Blob,language:'th'|'en'){
 if(audio.size>4_000_000)throw Error('เสียงยาวเกินไป โปรดบันทึกไม่เกิน 90 วินาที / Recording is too large.');
 const bytes=new Uint8Array(await audio.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 const res=await fetch('/api/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio:btoa(binary),mimeType:audio.type.split(';')[0],language}),signal:AbortSignal.timeout(50000)});const data=await res.json();if(!res.ok||!data.success)throw Error(data.error||'ถอดเสียงไม่สำเร็จ / Transcription failed.');if(typeof data.transcript!=='string')throw Error('รูปแบบข้อความถอดเสียงไม่ถูกต้อง / Invalid transcript.');return data.transcript;
}
// Compatibility exports for existing imports; this is not a Gemini Live streaming provider.
export {SpeechCaptureProvider as GeminiLiveTranscriptionProvider,SpeechCaptureProvider as BrowserSpeechFallbackProvider};
export const speechProvider:ISpeechProvider=new SpeechCaptureProvider();
