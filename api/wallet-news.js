const clean=s=>String(s||'')
 .replace(/<!\[CDATA\[|\]\]>/g,'')
 .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
 .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
 .replace(/<[^>]*>/g,'').trim();

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=1800');
  try{
    const q=encodeURIComponent('crypto whale wallet OR large wallet OR whale alert cryptocurrency');
    const url='https://news.google.com/rss/search?q='+q+'&hl=en-US&gl=US&ceid=US:en';
    const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 ThinkExistCrypto/1.0'}});
    if(!r.ok)throw new Error('news');
    const xml=await r.text();
    const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,12).map(m=>{
      const block=m[1];
      const pick=re=>clean((block.match(re)||[])[1]);
      return {
        title:pick(/<title>([\s\S]*?)<\/title>/),
        url:pick(/<link>([\s\S]*?)<\/link>/),
        source:pick(/<source[^>]*>([\s\S]*?)<\/source>/) || 'Google News',
        published:pick(/<pubDate>([\s\S]*?)<\/pubDate>/)
      };
    }).filter(x=>x.title&&x.url);
    res.status(200).json({items,updated:new Date().toISOString()});
  }catch(e){
    res.status(200).json({items:[],updated:new Date().toISOString()});
  }
};