interface BrowserRow {text:string;final:boolean;confidence?:number}
export interface BrowserUpdate {id:string;text:string;provisional:boolean;confidence?:number}
// Browser results are a mutable indexed list, not append-only transcript chunks.
// One instance belongs to one recognition run; consumed final indexes cannot repeat.
export class BrowserTranscriptAssembler {
  private rows=new Map<number,BrowserRow>();
  private consumed=new Set<number>();
  private id=crypto.randomUUID();
  accept(event:any):BrowserUpdate|null {
    for(const index of this.rows.keys())if(index>=event.results.length)this.rows.delete(index);
    for(let i=event.resultIndex;i<event.results.length;i++){
      if(this.consumed.has(i))continue;
      const result=event.results[i],alternative=result?.[0];
      if(typeof alternative?.transcript!=='string')continue;
      this.rows.set(i,{text:alternative.transcript.trim(),final:!!result.isFinal,confidence:alternative.confidence});
    }
    return this.pending();
  }
  pending():BrowserUpdate|null {
    const rows=[...this.rows.entries()].sort(([a],[b])=>a-b).map(([,row])=>row);
    const text=rows.map(row=>row.text).filter(Boolean).join(' ').trim();
    const known=rows.map(row=>row.confidence).filter((n):n is number=>typeof n==='number'&&n>0);
    return text?{id:this.id,text,provisional:rows.some(row=>!row.final),confidence:known.length?Math.min(...known):undefined}:null;
  }
  flush(includeInterim=false):BrowserUpdate|null {
    const pending=this.pending();if(!pending||pending.provisional&&!includeInterim)return null;
    for(const index of this.rows.keys())this.consumed.add(index);
    this.rows.clear();this.id=crypto.randomUUID();return pending;
  }
}
