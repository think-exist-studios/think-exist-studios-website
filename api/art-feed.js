const fetchWithTimeout=(url,opts={},ms=6000)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),ms);return fetch(url,{...opts,signal:controller.signal}).finally(()=>clearTimeout(timer));};
const clean=s=>String(s||'')
 .replace(/<!\[CDATA\[|\]\]>/g,'')
 .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
 .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
 .replace(/<[^>]*>/g,'').trim();

const rssItems=xml=>[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>{
 const b=m[1], pick=re=>clean((b.match(re)||[])[1]);
 return {title:pick(/<title>([\s\S]*?)<\/title>/),url:pick(/<link>([\s\S]*?)<\/link>/),source:pick(/<source[^>]*>([\s\S]*?)<\/source>/)||'News',published:pick(/<pubDate>([\s\S]*?)<\/pubDate>/)};
}).filter(x=>x.title&&x.url);

const getNews=async q=>{
 const u='https://news.google.com/rss/search?q='+encodeURIComponent(q)+'&hl=en-US&gl=US&ceid=US:en';
 const r=await fetchWithTimeout(u,{headers:{'User-Agent':'Mozilla/5.0 ThinkExistArt/1.0'}},6000);
 if(!r.ok)return [];
 return rssItems(await r.text()).slice(0,8);
};

module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=1800');
 const out={artworks:[],artistNews:[],updated:new Date().toISOString()};
 try{
   const day=Math.floor(Date.now()/86400000), page=(day%40)+1;
   const ar=await fetchWithTimeout('https://api.artic.edu/api/v1/artworks/search?query%5Bterm%5D%5Bis_public_domain%5D=true&limit=8&page='+page+'&fields=id,title,artist_display,date_display,image_id,is_public_domain',{},6500);
   if(ar.ok){
     const d=await ar.json(),base=d.config?.iiif_url||'https://www.artic.edu/iiif/2';
     out.artworks=(d.data||[]).filter(x=>x.image_id&&x.is_public_domain!==false).map(x=>({
       id:x.id,title:x.title,artist:x.artist_display,date:x.date_display,
       image:base+'/'+x.image_id+'/full/843,/0/default.jpg',
       url:'https://www.artic.edu/artworks/'+x.id
     }));
   }
 }catch(e){}
 const artistNews=await getNews('(artist OR illustrator OR painter OR sculptor OR "digital artist") (exhibition OR gallery OR interview OR artwork)').catch(()=>[]);
 out.artistNews=artistNews;
 res.status(200).json(out);
};