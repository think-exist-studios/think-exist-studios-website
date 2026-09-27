const channels=[
  {name:'MKBHD',id:'UCBJycsmduvYEL83R_U4JriQ'},
  {name:'Linus Tech Tips',id:'UCXuqSBlHAE6Xw-yeJA0Tunw'},
  {name:'The Verge',id:'UCddiUEpeqJcYeBxX1IVBKvQ'},
  {name:'CNET',id:'UCYBzNzkwFRJgF_pWcR9fmcA'},
  {name:'NASA',id:'UCA_DiR1FfKNvjuUpBHmylQw'},
  {name:'Google Developers',id:'UC_x5XG1OV2P6uZZ5FSM9Ttw'}
];
const clean=s=>String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=1800');
 try{
  const lists=await Promise.all(channels.map(async c=>{
   const r=await fetch('https://www.youtube.com/feeds/videos.xml?channel_id='+c.id,{headers:{'User-Agent':'Mozilla/5.0 ThinkExistDiscover/1.0'}});
   if(!r.ok)return[];
   const xml=await r.text();
   return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0,5).map(m=>{
    const e=m[1];
    const pick=re=>clean((e.match(re)||[])[1]);
    return {id:pick(/<yt:videoId>([^<]+)<\/yt:videoId>/),title:pick(/<title>([\s\S]*?)<\/title>/),published:pick(/<published>([^<]+)<\/published>/),channel:c.name};
   }).filter(v=>v.id);
  }));
  const items=lists.flat().sort((a,b)=>new Date(b.published)-new Date(a.published));
  for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}
  res.status(200).json({items:items.slice(0,12),updated:new Date().toISOString()});
 }catch(e){res.status(200).json({items:[],updated:new Date().toISOString()});}
}