import {build as viteBuild} from 'vite';
import {build} from 'esbuild';
import {readFile,readdir,mkdir,cp,rm} from 'node:fs/promises';
import path from 'node:path';
await rm('dist',{recursive:true,force:true});
await viteBuild({build:{outDir:'dist/client'}});
const assets={};async function collect(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())await collect(full);else{const url='/'+path.relative('dist/client',full).replaceAll('\\','/');const ext=path.extname(full);const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.txt':'text/plain; charset=utf-8'}[ext];if(!mime)throw Error(`Unsupported public asset ${url}`);assets[url]={content:await readFile(full,'utf8'),mime};}}}await collect('dist/client');
await build({entryPoints:['src/server/worker.ts'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',plugins:[{name:'public-assets',setup(b){b.onResolve({filter:/^virtual:assets$/},()=>({path:'assets',namespace:'embedded'}));b.onLoad({filter:/.*/,namespace:'embedded'},()=>({contents:`export default ${JSON.stringify(assets)}`,loader:'js'}));}}]});
await mkdir('dist/.openai',{recursive:true});await cp('.openai/hosting.json','dist/.openai/hosting.json');console.log('Worker and frontend built. No credentials embedded.');
