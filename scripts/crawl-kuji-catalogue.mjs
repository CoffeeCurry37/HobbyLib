import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';import{resolve,join}from'node:path';import{loadRadar}from'./load-radar.mjs';
const output=resolve(process.argv[2]);mkdirSync(output,{recursive:true});const radar=loadRadar(),{fetchPublic}=radar.get('collector'),{readHtml,all,cls,tag,text}=radar.get('html');
 const canonical=raw=>{const u=new URL(raw);u.search='';u.hash='';return u.href};
 const pending=process.argv.slice(3).map(canonical),seen=new Set(),campaigns=[],failures=[];
while(pending.length&&seen.size<60){const url=pending.shift();if(seen.has(url))continue;seen.add(url);try{
 const id=new URL(url).pathname.split('/').pop(),file=join(output,id+'.html'),page=existsSync(file)?{text:readFileSync(file,'utf8'),url}:await fetchPublic(url);if(!existsSync(file))writeFileSync(file,page.text);
 const doc=readHtml(page.text),about=cls(doc,'aboutCol'),name=text(tag(about||doc,'h2'));if(!name.includes('一番くじ'))throw new Error('No campaign heading');
 const date=text(about).match(/(?:店頭販売[:：]\s*)?((?:19|20)\d{2})年(\d{1,2})月(\d{1,2})日/),releaseDate=date?date[1]+'/'+date[2].padStart(2,'0')+'/'+date[3].padStart(2,'0'):'';
 const prizes=all(cls(doc,'listCol')||doc,n=>(n.attrs.class||'').split(/\s+/).includes('itemColList')).map(n=>{
  const title=text(cls(n,'name')),award=title.match(/^([A-Z](?:-\d+)?賞|ラストワン賞|ダブルチャンス(?:キャンペーン)?)/)?.[1],data=text(cls(n,'data'))||text(cls(n,'itemColDetailHead')),count=Number(data.match(/全\s*(\d+)\s*種/)?.[1]||0),gallery=cls(n,'itemColGallery');
  const images=[...new Set(all(gallery||n,x=>x.tag==='img').map(x=>x.attrs.src).filter(x=>x?.startsWith('https://assets.1kuji.com/')))];return {award,title:title.replace(/^[A-Z](?:-\d+)?賞\s*|^ラストワン賞\s*/,''),count:count||0,images,description:text(cls(n,'itemColDetailHead'))};
 }).filter(p=>p.award&&p.images.length);
 if(!prizes.length)throw new Error('No scoped awards');const record={id,name,url,releaseDate,prizes,at:new Date().toISOString()};campaigns.push(record);writeFileSync(join(output,id+'.json'),JSON.stringify(record,null,2));
 for(const a of all(doc,n=>n.tag==='a'&&!!n.attrs.href)){const u=new URL(a.attrs.href,url);u.search='';u.hash='';if(u.hostname==='1kuji.com'&&/^\/products\/fate[\w-]*$/.test(u.pathname)&&!seen.has(u.href)&&!pending.includes(u.href))pending.push(u.href)}
 console.log(JSON.stringify({name,releaseDate,awards:prizes.length,queue:pending.length}));await new Promise(r=>setTimeout(r,1200));
 }catch(e){failures.push({url,error:e.message});}}
writeFileSync(join(output,'catalogue.json'),JSON.stringify({campaigns,failures,next:pending},null,2));console.log(JSON.stringify({campaigns:campaigns.length,failures}));radar.close();
