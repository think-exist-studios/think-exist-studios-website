const fetchWithTimeout=(url,opts={},ms=6000)=>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),ms);
 return fetch(url,{...opts,signal:controller.signal}).finally(()=>clearTimeout(timer));
};
const safe=s=>String(s||'').replace(/[^a-zA-Z0-9]/g,'');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate=120');
 const chain=safe(Array.isArray(req.query?.chain)?req.query.chain[0]:req.query?.chain)||'solana';
 const address=safe(Array.isArray(req.query?.address)?req.query.address[0]:req.query?.address)||'So11111111111111111111111111111111111111112';
 if(chain.length>20||address.length<20||address.length>120)return res.status(400).json({pair:null,error:'Invalid pair or token address'});
 try{
  const h={'User-Agent':'Mozilla/5.0 ThinkExistCrypto/1.0','Accept':'application/json'};
  let pairs=[];
  const pr=await fetchWithTimeout('https://api.dexscreener.com/latest/dex/pairs/'+encodeURIComponent(chain)+'/'+encodeURIComponent(address),{headers:h},5500).catch(()=>null);
  if(pr&&pr.ok){const d=await pr.json();pairs=Array.isArray(d.pairs)?d.pairs:[];}
  if(!pairs.length){
   const tr=await fetchWithTimeout('https://api.dexscreener.com/latest/dex/tokens/'+encodeURIComponent(address),{headers:h},5500).catch(()=>null);
   if(tr&&tr.ok){const d=await tr.json();pairs=(Array.isArray(d.pairs)?d.pairs:[]).filter(x=>!chain||x.chainId===chain);}
  }
  const pair=pairs.sort((a,b)=>(Number(b.liquidity?.usd)||0)-(Number(a.liquidity?.usd)||0))[0]||null;
  if(!pair)return res.status(200).json({pair:null,updated:new Date().toISOString()});
  res.status(200).json({pair:{
   chainId:pair.chainId,dexId:pair.dexId,pairAddress:pair.pairAddress,url:pair.url,
   baseToken:pair.baseToken,quoteToken:pair.quoteToken,priceUsd:pair.priceUsd,
   priceNative:pair.priceNative,priceChange:pair.priceChange,liquidity:pair.liquidity,
   volume:pair.volume,txns:pair.txns,fdv:pair.fdv,marketCap:pair.marketCap
  },updated:new Date().toISOString()});
 }catch(e){
  res.status(200).json({pair:null,error:'DEX data temporarily unavailable',updated:new Date().toISOString()});
 }
};