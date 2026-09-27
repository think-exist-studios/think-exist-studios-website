const ALLOWED=new Set([
 'i.ytimg.com','img.youtube.com','cdn.myanimelist.net','www.artic.edu',
 'artic.edu','lakeimagesweb.artic.edu','coin-images.coingecko.com','assets.coingecko.com'
]);

const fetchWithTimeout=(url,opts={},ms=6500)=>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),ms);
 return fetch(url,{...opts,signal:controller.signal}).finally(()=>clearTimeout(timer));
};

module.exports=async function handler(req,res){
 try{
  const raw=Array.isArray(req.query?.url)?req.query.url[0]:req.query?.url;
  if(!raw)return res.status(400).end('Missing url');
  const u=new URL(raw);
  if(u.protocol!=='https:'||!ALLOWED.has(u.hostname))return res.status(403).end('Host not allowed');

  const r=await fetchWithTimeout(u.toString(),{
   headers:{'User-Agent':'Mozilla/5.0 ThinkExistMediaProxy/1.0','Accept':'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'}
  },6500);
  if(!r.ok)return res.status(502).end('Image unavailable');
  const type=r.headers.get('content-type')||'';
  if(!type.startsWith('image/'))return res.status(415).end('Not an image');
  const len=Number(r.headers.get('content-length')||0);
  if(len>6_000_000)return res.status(413).end('Image too large');
  const buf=Buffer.from(await r.arrayBuffer());
  if(buf.length>6_000_000)return res.status(413).end('Image too large');
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.status(200).send(buf);
 }catch(e){
  res.status(504).end('Image timed out');
 }
};