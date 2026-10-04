import type {IncomingMessage,ServerResponse} from 'node:http';
import {handleApi, type ApiEnv,json} from '../src/server/api';

export const config={maxDuration:60};
export default async function handler(req:IncomingMessage & {body?:unknown},res:ServerResponse){
  try{
    const headers=new Headers();
    for(const [name,value] of Object.entries(req.headers))if(typeof value==='string'&&!['oai-authenticated-user-email','x-scout-client-id'].includes(name))headers.set(name,value);
    headers.set('x-scout-client-id',String(req.headers['x-vercel-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0]);
    const host=String(req.headers.host||'localhost');
    let body:string|undefined;
    if(!['GET','HEAD'].includes(req.method||'GET')){
      if(req.body!==undefined)body=typeof req.body==='string'?req.body:JSON.stringify(req.body);
      else {const chunks:Buffer[]=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>6_000_000){const response=json({success:false,code:'INPUT_TOO_LARGE'},413);res.statusCode=response.status;res.end(await response.text());return;}chunks.push(Buffer.from(chunk));}body=Buffer.concat(chunks).toString();}
    }
    const request=new Request(`https://${host}${req.url}`,{method:req.method||'GET',headers,body});
    const response=await handleApi(request,{...process.env,VERCEL:'1',TRUST_PLATFORM_IDENTITY:'false'} as ApiEnv);
    res.statusCode=response.status;response.headers.forEach((value,key)=>res.setHeader(key,value));res.end(await response.text());
  }catch{res.statusCode=502;res.setHeader('content-type','application/json');res.end(JSON.stringify({success:false,code:'REQUEST_FAILED'}));}
}
