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
 const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 ThinkExistArt/1.0'}});
 if(!r.ok)return [];
 return rssItems(await r.text()).slice(0,8);
};

module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=1800');
 const out={artworks:[],artistNews:[],nfts:[],nftNews:[],updated:new Date().toISOString()};
 try{
   const day=Math.floor(Date.now()/86400000), page=(day%40)+1;
   const ar=await fetch('https://api.artic.edu/api/v1/artworks/search?query%5Bterm%5D%5Bis_public_domain%5D=true&limit=8&page='+page+'&fields=id,title,artist_display,date_display,image_id,is_public_domain');
   if(ar.ok){
     const d=await ar.json(),base=d.config?.iiif_url||'https://www.artic.edu/iiif/2';
     out.artworks=(d.data||[]).filter(x=>x.image_id&&x.is_public_domain!==false).map(x=>({
       id:x.id,title:x.title,artist:x.artist_display,date:x.date_display,
       image:base+'/'+x.image_id+'/full/843,/0/default.jpg',
       url:'https://www.artic.edu/artworks/'+x.id
     }));
   }
 }catch(e){}
 try{
   const cr=await fetch('https://api.coingecko.com/api/v3/search/trending',{headers:{accept:'application/json'}});
   if(cr.ok){
     const d=await cr.json();
     out.nfts=(d.nfts||[]).slice(0,7).map(raw=>{
       const x=raw.item||raw;
       const floor=x.floor_price_in_native_currency;
       const native=x.native_currency_symbol||'';
       return {id:x.id,name:x.name,symbol:x.symbol,thumb:x.thumb||x.small||'',floor:floor!==undefined&&floor!==null?(Number(floor).toLocaleString(undefined,{maximumFractionDigits:4})+' '+native).trim():'',change:x.floor_price_24h_percentage_change??null,url:'https://www.coingecko.com/en/nft/'+encodeURIComponent(x.id||'')};
     });
   }
 }catch(e){}
 const [artistNews,nftNews]=await Promise.all([
   getNews('(artist OR illustrator OR painter OR sculptor OR "digital artist") (exhibition OR gallery OR interview OR artwork)'),
   getNews('(NFT OR "digital collectible") (artist OR art OR creator OR marketplace)')
 ]);
 out.artistNews=artistNews; out.nftNews=nftNews;
 res.status(200).json(out);
};