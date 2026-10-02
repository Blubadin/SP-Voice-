import {StreamTranscriptAssembler} from '../../domain/streamTranscript';
import type {SportType} from '../../domain/types';
export interface ContinuousCallbacks {onTranscript:(id:string,text:string,final:boolean)=>void;onLevel:(level:number)=>void;onStatus:(status:'connecting'|'listening'|'reconnecting'|'stopped')=>void;onError:(message:string)=>void;}
export class ContinuousSpeechProvider {
 private stream:MediaStream|null=null;private context:AudioContext|null=null;private node:AudioWorkletNode|null=null;private socket:WebSocket|null=null;private recognition:any=null;
 private assembler=new StreamTranscriptAssembler();private active=false;private epoch=0;private heartbeat:ReturnType<typeof setInterval>|null=null;private retry:ReturnType<typeof setTimeout>|null=null;private retries=0;private browserId=crypto.randomUUID();private browserFinal='';private browserInterim='';private buffer:ArrayBuffer[]=[];
 private callbacks:ContinuousCallbacks|null=null;private options:{language:'th'|'en';sport:SportType;deviceId?:string;provider:'deepgram'|'browser'}|null=null;
 isCapturing(){return this.active;}
 async start(callbacks:ContinuousCallbacks,options:NonNullable<ContinuousSpeechProvider['options']>){
 if(this.active)return false;this.active=true;const epoch=++this.epoch;this.callbacks=callbacks;this.options=options;this.retries=0;this.assembler=new StreamTranscriptAssembler();this.buffer=[];callbacks.onStatus('connecting');
 try{
 const stream=await navigator.mediaDevices.getUserMedia({audio:{...(options.deviceId&&options.deviceId!=='default'?{deviceId:{exact:options.deviceId}}:{}),echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
 if(epoch!==this.epoch){stream.getTracks().forEach(t=>t.stop());return false;}this.stream=stream;
 for(const track of stream.getTracks())track.onended=()=>{if(this.active){callbacks.onError('ไมโครโฟนถูกตัดการเชื่อมต่อ / Microphone disconnected');void this.stop();}};
 const Ctx=window.AudioContext||(window as any).webkitAudioContext;this.context=new Ctx();await this.context!.resume();
 await this.context!.audioWorklet.addModule('/scout-pcm-worklet.js');if(epoch!==this.epoch)return false;
 const source=this.context!.createMediaStreamSource(stream);this.node=new AudioWorkletNode(this.context!,'scout-pcm');source.connect(this.node);const mute=this.context!.createGain();mute.gain.value=0;this.node.connect(mute).connect(this.context!.destination);
 this.node.port.onmessage=({data})=>{if(!this.active)return;if(typeof data.level==='number')callbacks.onLevel(Math.min(100,Math.round(data.level*300)));if(data.pcm&&options.provider==='deepgram'){
 if(this.socket?.readyState===WebSocket.OPEN){if(this.socket.bufferedAmount>1_000_000){callbacks.onError('เครือข่ายส่งเสียงไม่ทัน หยุดเพื่อป้องกันข้อมูลคลาดเคลื่อน / Audio upload is backlogged');void this.stop();}else this.socket.send(data.pcm);}
 else{this.buffer.push(data.pcm);if(this.buffer.length>30){callbacks.onError('การเชื่อมต่อขาดช่วง เสียงบางช่วงอาจหาย กรุณาตรวจแรลลี่นี้ / Connection gap; verify this rally');this.buffer.shift();}}
 }};
 if(options.provider==='deepgram')await this.connect(epoch);else this.startBrowser(epoch);
 if(epoch!==this.epoch)return false;return true;
 }catch(e:any){if(epoch===this.epoch){callbacks.onError(e.name==='NotAllowedError'?'กรุณาอนุญาตไมโครโฟน / Allow microphone access':e.message||'เปิดไมค์ไม่สำเร็จ');await this.stop();}return false;}
 }
 private emit(update:ReturnType<StreamTranscriptAssembler['accept']>){if(update)this.callbacks?.onTranscript(update.id,update.text,update.final);}
 private async connect(epoch:number){
 const response=await fetch('/api/deepgram-token',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok||!data.token)throw Error(data.error||'Deepgram connection unavailable');if(epoch!==this.epoch)return;
 const query=new URLSearchParams({model:'nova-3',language:this.options!.language==='th'?'th':'en',encoding:'linear16',sample_rate:String(this.context!.sampleRate),channels:'1',interim_results:'true',endpointing:'400',utterance_end_ms:'1000',vad_events:'true',punctuate:'false'});
 // Keep provider hints compact; the full categorized dictionary belongs in the parser.
 if(this.options!.language==='en')for(const term of ['serve','reception','attack','block','dig'])query.append('keyterm',term);
 const socket=new WebSocket(`wss://api.deepgram.com/v1/listen?${query}`,['bearer',data.token]);this.socket=socket;
 await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>{socket.close();reject(Error('Deepgram เชื่อมต่อหมดเวลา / Connection timed out'));},12000);
 socket.onopen=()=>{clearTimeout(timeout);if(epoch!==this.epoch){socket.close();resolve();return;}this.retries=0;for(const pcm of this.buffer)socket.send(pcm);this.buffer=[];this.callbacks?.onStatus('listening');if(this.heartbeat)clearInterval(this.heartbeat);this.heartbeat=setInterval(()=>{if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'KeepAlive'}));},4000);resolve();};
 socket.onerror=()=>{clearTimeout(timeout);reject(Error('Deepgram เชื่อมต่อเสียงสดไม่สำเร็จ ตรวจคีย์ เครดิต และเครือข่าย / Live connection failed'));};
 socket.onmessage=e=>{if(epoch!==this.epoch)return;try{const packet=JSON.parse(e.data);if(packet.type==='Error'){this.callbacks?.onError('Deepgram ปฏิเสธสตรีม กรุณาตรวจเครดิตและสิทธิ์โมเดล / Stream rejected');void this.stop();}else{const update=this.assembler.accept(packet);this.emit(update);if(packet.is_final&&update&&!update.final&&/ได้แต้ม|ได้หนึ่ง|บวก\s*(?:หนึ่ง|1)|\+\s*1|เอซ|\bace\b|\bkill\b/.test(update.text))this.emit(this.assembler.flush());}}catch{this.callbacks?.onError('ข้อมูลสตรีมไม่ถูกต้อง / Invalid stream data');}};
 socket.onclose=()=>{clearTimeout(timeout);reject(Error('Deepgram ปิดการเชื่อมต่อก่อนพร้อม / Connection closed'));if(epoch!==this.epoch||!this.active)return;this.socket=null;this.callbacks?.onStatus('reconnecting');this.callbacks?.onError('กำลังเชื่อมต่อใหม่ โปรดตรวจช่วงที่ขาดการเชื่อมต่อ / Reconnecting; verify the interrupted sequence');if(this.retries++>=3){void this.stop();return;}this.assembler=new StreamTranscriptAssembler();this.retry=setTimeout(()=>{void this.connect(epoch).catch(e=>{this.callbacks?.onError(e.message);void this.stop();});},1000);};
 });
 }
 private startBrowser(epoch:number){
 const Rec=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Rec)throw Error('เบราว์เซอร์ไม่รองรับ กรุณาตั้งค่า Deepgram / Configure Deepgram for live transcription');
 const recognition=new Rec();this.recognition=recognition;recognition.lang=this.options!.language==='th'?'th-TH':'en-US';recognition.continuous=true;recognition.interimResults=true;this.browserFinal='';this.browserInterim='';this.browserId=crypto.randomUUID();
 recognition.onresult=(e:any)=>{if(epoch!==this.epoch)return;let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)this.browserFinal+=' '+t;else interim+=t;}this.browserInterim=interim;this.callbacks?.onTranscript(this.browserId,(this.browserFinal+' '+interim).trim(),false);if(this.retry)clearTimeout(this.retry);this.retry=setTimeout(()=>this.flushBrowser(),700);};
 recognition.onerror=(e:any)=>{if(['not-allowed','service-not-allowed','audio-capture','network'].includes(e.error)){this.callbacks?.onError(`Browser speech ${e.error}`);void this.stop();}};
 recognition.onend=()=>{if(epoch!==this.epoch||!this.active)return;this.flushBrowser();this.retry=setTimeout(()=>{if(epoch===this.epoch&&this.active){try{recognition.start();}catch{this.callbacks?.onError('ระบบถอดเสียงเบราว์เซอร์หยุด / Browser recognition stopped');void this.stop();}}},300);};
 recognition.start();this.callbacks?.onStatus('listening');
 }
 private flushBrowser(){if(!this.browserFinal.trim())return;this.callbacks?.onTranscript(this.browserId,this.browserFinal.trim(),true);this.browserFinal='';this.browserId=crypto.randomUUID();}
 async stop(){if(!this.active)return;this.active=false;
 if(this.retry)clearTimeout(this.retry);if(this.heartbeat)clearInterval(this.heartbeat);this.retry=null;this.heartbeat=null;
 if(this.socket?.readyState===WebSocket.OPEN){this.socket.send(JSON.stringify({type:'Finalize'}));await new Promise(resolve=>setTimeout(resolve,500));if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'CloseStream'}));}
 this.emit(this.assembler.flush());this.flushBrowser();++this.epoch;this.socket?.close();this.socket=null;
 if(this.recognition){this.recognition.onend=null;this.recognition.onresult=null;try{this.recognition.abort();}catch{}this.recognition=null;}
 this.node?.disconnect();this.node=null;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;if(this.context&&this.context.state!=='closed')await this.context.close().catch(()=>{});this.context=null;this.buffer=[];this.callbacks?.onLevel(0);this.callbacks?.onStatus('stopped');
 }
}
