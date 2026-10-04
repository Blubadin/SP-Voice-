// Mono PCM in ~21 ms batches at 48 kHz, with an explicit tail flush.
class ScoutPcm extends AudioWorkletProcessor {
 constructor(){super();this.buffer=new Int16Array(1024);this.offset=0;this.energy=0;this.port.onmessage=({data})=>{if(data.type==='flush'){this.flush();this.port.postMessage({flushed:true});}};}
 flush(){if(!this.offset)return;const pcm=this.buffer.slice(0,this.offset).buffer;this.port.postMessage({pcm,level:Math.sqrt(this.energy/this.offset)},[pcm]);this.buffer=new Int16Array(1024);this.offset=0;this.energy=0;}
 process(inputs){const channels=inputs[0];if(!channels?.length)return true;for(let i=0;i<channels[0].length;i++){let sample=0;for(const channel of channels)sample+=channel[i]||0;sample=Math.max(-1,Math.min(1,sample/channels.length));this.energy+=sample*sample;this.buffer[this.offset++]=sample<0?sample*32768:sample*32767;if(this.offset===this.buffer.length)this.flush();}return true;}
}
registerProcessor('scout-pcm',ScoutPcm);
