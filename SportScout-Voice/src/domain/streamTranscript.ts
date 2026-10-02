// Provider finals are time ranges, not whole-session transcripts. A duplicate range
// must never cause another event or point. Interim text is replaceable evidence.
export class StreamTranscriptAssembler {
 private ranges=new Map<string,string>();private committed=new Set<string>();private id=crypto.randomUUID();private interim='';
 accept(packet:any):{id:string;text:string;final:boolean}|null{
 if(packet.type==='UtteranceEnd')return this.flush();
 if(packet.type!=='Results')return null;
 const text=packet.channel?.alternatives?.[0]?.transcript;if(typeof text!=='string')return null;
 const range=`${packet.start}:${packet.duration}`;
 if(packet.is_final){if(!this.committed.has(range)){this.ranges.set(range,text);this.committed.add(range);}this.interim='';}else this.interim=text;
 const combined=[...this.ranges.values(),this.interim].filter(Boolean).join(' ').trim();
 if(packet.speech_final||packet.from_finalize)return this.flush();
 return combined?{id:this.id,text:combined,final:false}:null;
 }
 flush(){const text=[...this.ranges.values()].filter(Boolean).join(' ').trim();const id=this.id;this.ranges.clear();this.interim='';this.id=crypto.randomUUID();return text?{id,text,final:true}:null;}
}
