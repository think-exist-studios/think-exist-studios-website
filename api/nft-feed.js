const fetchWithTimeout=(url,opts={},ms=6500)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),ms);return fetch(url,{...opts,signal:controller.signal}).finally(()=>clearTimeout(timer));};
const clean=s=>String(s||'')
 .replace(/<!\[CDATA\[|\]\]>/g,'')
 .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
 .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
 .replace(/<[^>]*>/g,'').trim();

const rssItems=xml=>[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>{
 const b=m[1],pick=re=>clean((b.match(re)||[])[1]);
 return {title:pick(/<title>([\s\S]*?)<\/title>/),url:pick(/<link>([\s\S]*?)<\/link>/),source:pick(/<source[^>]*>([\s\S]*?)<\/source>/)||'News',published:pick(/<pubDate>([\s\S]*?)<\/pubDate>/)};
}).filter(x=>x.title&&x.url);

async function getNews(){
 const q='(NFT OR "digital collectible" OR "on-chain art") (artist OR art OR creator OR marketplace OR collection)';
 const u='https://news.google.com/rss/search?q='+encodeURIComponent(q)+'&hl=en-US&gl=US&ceid=US:en';
 const r=await fetchWithTimeout(u,{headers:{'User-Agent':'Mozilla/5.0 ThinkExistNFT/1.0'}},6500);
 if(!r.ok)return [];
 return rssItems(await r.text()).slice(0,10);
}

module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=1800');
 const out={nfts:[],nftNews:[],updated:new Date().toISOString()};
 try{
   const cr=await fetchWithTimeout('https://api.coingecko.com/api/v3/search/trending',{headers:{accept:'application/json','user-agent':'ThinkExist-NFT-Radar/1.0'}},6500);
   if(cr.ok){
     const d=await cr.json();
     out.nfts=(d.nfts||[]).slice(0,8).map(raw=>{
       const x=raw.item||raw;
       const floor=x.floor_price_in_native_currency;
       const native=x.native_currency_symbol||'';
       return {
         id:x.id,name:x.name,symbol:x.symbol,thumb:x.thumb||x.small||'',
         floor:floor!==undefined&&floor!==null?(Number(floor).toLocaleString(undefined,{maximumFractionDigits:4})+' '+native).trim():'',
         change:x.floor_price_24h_percentage_change??null,
         url:'https://www.coingecko.com/en/nft/'+encodeURIComponent(x.id||'')
       };
     });
   }
 }catch(e){}
 try{out.nftNews=await getNews();}catch(e){out.nftNews=[];}
 res.status(200).json(out);
};