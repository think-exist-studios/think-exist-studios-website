const fetchWithTimeout=(url,opts={},ms=8000)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),ms);return fetch(url,{...opts,signal:controller.signal}).finally(()=>clearTimeout(timer));};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const clean=s=>String(s||'')
  .replace(/<!\[CDATA\[|\]\]>/g,'')
  .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/<[^>]*>/g,'').trim();

const STABLES=new Set([
  'tether','usd-coin','dai','ethena-usde','first-digital-usd','paypal-usd','true-usd',
  'usdd','frax','gemini-dollar','pax-dollar','usdb','usds','usual-usd','crvusd'
]);
const WRAPPED=new Set(['wrapped-bitcoin','wrapped-steth','weth','wrapped-solana']);

function pct(v){const n=Number(v);return Number.isFinite(n)?n:0;}
function median(values){const a=values.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return 0;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function money(n){return Number(n||0);}

async function fetchMarkets(){
  const url='https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d,30d';
  const r=await fetchWithTimeout(url,{headers:{accept:'application/json','user-agent':'ThinkExist-MOSES-Report/1.0'},cache:'no-store'},8000);
  if(!r.ok)throw new Error('market');
  const data=await r.json();
  return Array.isArray(data)?data:[];
}

async function fetchNews(query,limit=6){
  const q=encodeURIComponent(query);
  const url='https://news.google.com/rss/search?q='+q+'&hl=en-US&gl=US&ceid=US:en';
  const r=await fetchWithTimeout(url,{headers:{'User-Agent':'Mozilla/5.0 ThinkExist-MOSES/1.0'}},7500);
  if(!r.ok)return [];
  const xml=await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,limit).map(m=>{
    const b=m[1];
    const pick=re=>clean((b.match(re)||[])[1]);
    return {
      title:pick(/<title>([\s\S]*?)<\/title>/),
      url:pick(/<link>([\s\S]*?)<\/link>/),
      source:pick(/<source[^>]*>([\s\S]*?)<\/source>/)||'Google News',
      published:pick(/<pubDate>([\s\S]*?)<\/pubDate>/)
    };
  }).filter(x=>x.title&&x.url);
}

function classifyMarket(coins){
  const usable=coins.filter(c=>!STABLES.has(c.id));
  const changes=usable.map(c=>pct(c.price_change_percentage_24h));
  const breadth=usable.length?usable.filter(c=>pct(c.price_change_percentage_24h)>0).length/usable.length:0;
  const med=median(changes);
  const btc=usable.find(c=>c.id==='bitcoin');
  const btc24=pct(btc?.price_change_percentage_24h);

  let condition='Mixed / Rotation';
  let tone='neutral';
  let explanation='The market is mixed, with gains and losses spread across major assets.';
  if(breadth>=0.72&&med>=3&&btc24>=1.5){
    condition='Potential Bull-Run Conditions';
    tone='positive';
    explanation='Broad market participation and positive median momentum suggest risk-on conditions. This is not confirmation that a sustained bull run has begun.';
  }else if(breadth>=0.62&&med>=1.5){
    condition='Broad Market Strength';
    tone='positive';
    explanation='A majority of tracked assets are advancing, showing broad positive participation.';
  }else if(breadth<=0.25&&med<=-4){
    condition='Sharp Market Drop';
    tone='negative';
    explanation='Losses are broad and the median move is materially negative, indicating elevated market-wide selling pressure.';
  }else if(breadth<=0.38&&med<=-1.5){
    condition='Risk-Off Pressure';
    tone='negative';
    explanation='Most tracked assets are weakening, suggesting defensive market behavior.';
  }
  return {
    condition,tone,explanation,
    breadth_positive_pct:Number((breadth*100).toFixed(1)),
    median_24h_change_pct:Number(med.toFixed(2)),
    bitcoin_24h_change_pct:Number(btc24.toFixed(2))
  };
}

function unusualMoves(coins){
  return coins
    .filter(c=>!STABLES.has(c.id)&&!WRAPPED.has(c.id))
    .map(c=>({
      id:c.id,name:c.name,symbol:String(c.symbol||'').toUpperCase(),
      price_usd:money(c.current_price),
      change_24h_pct:pct(c.price_change_percentage_24h),
      change_7d_pct:pct(c.price_change_percentage_7d_in_currency),
      market_cap_rank:c.market_cap_rank||null
    }))
    .filter(c=>Math.abs(c.change_24h_pct)>=10||Math.abs(c.change_7d_pct)>=25)
    .sort((a,b)=>Math.max(Math.abs(b.change_24h_pct),Math.abs(b.change_7d_pct))-Math.max(Math.abs(a.change_24h_pct),Math.abs(a.change_7d_pct)))
    .slice(0,8)
    .map(c=>({...c,flag:c.change_24h_pct>=10?'Unusual rally':c.change_24h_pct<=-10?'Sharp drop':c.change_7d_pct>=25?'Strong 7-day run':'Weak 7-day trend'}));
}

function opportunityScore(c){
  const cap=Math.max(1,money(c.market_cap));
  const vol=Math.max(0,money(c.total_volume));
  const rank=Number(c.market_cap_rank||100);
  const ch24=pct(c.price_change_percentage_24h);
  const ch7=pct(c.price_change_percentage_7d_in_currency);
  const ch30=pct(c.price_change_percentage_30d_in_currency);
  const volRatio=cap>0?vol/cap:0;

  const liquidity=clamp((Math.log10(cap)-7)/4,0,1)*100;
  const activity=clamp(volRatio/0.18,0,1)*100;
  const momentum24=clamp((ch24+8)/20,0,1)*100;
  const momentum7=clamp((ch7+15)/45,0,1)*100;
  const momentum30=clamp((ch30+25)/75,0,1)*100;
  const upsideBand=rank<=5?58:rank<=15?82:rank<=30?92:76;
  const extremePenalty=Math.max(0,Math.abs(ch24)-18)*1.2+Math.max(0,Math.abs(ch7)-45)*0.4;
  const score=clamp(
    liquidity*0.22+activity*0.18+momentum24*0.12+momentum7*0.18+momentum30*0.18+upsideBand*0.12-extremePenalty,
    0,100
  );
  return {
    score:Number(score.toFixed(1)),
    liquidity_score:Number(liquidity.toFixed(1)),
    activity_score:Number(activity.toFixed(1)),
    momentum_score:Number(((momentum24+momentum7+momentum30)/3).toFixed(1)),
    risk_note:Math.abs(ch24)>=15?'Very high short-term volatility':rank>30?'Smaller-cap risk is elevated':'Normal crypto-market risk remains high'
  };
}

function lucrativeWatchlist(coins){
  return coins
    .filter(c=>!STABLES.has(c.id)&&!WRAPPED.has(c.id)&&money(c.market_cap)>0&&money(c.total_volume)>0)
    .map(c=>{
      const s=opportunityScore(c);
      const ch24=pct(c.price_change_percentage_24h);
      const ch7=pct(c.price_change_percentage_7d_in_currency);
      const ch30=pct(c.price_change_percentage_30d_in_currency);
      const reasons=[];
      if(s.liquidity_score>=75)reasons.push('deep market liquidity');
      if(s.activity_score>=65)reasons.push('strong trading activity');
      if(ch7>5)reasons.push('positive 7-day momentum');
      if(ch30>8)reasons.push('positive 30-day momentum');
      if(Number(c.market_cap_rank||999)>5&&Number(c.market_cap_rank||999)<=30)reasons.push('mid-to-large-cap upside profile');
      return {
        id:c.id,name:c.name,symbol:String(c.symbol||'').toUpperCase(),
        price_usd:money(c.current_price),market_cap_rank:c.market_cap_rank||null,
        market_cap_usd:money(c.market_cap),volume_24h_usd:money(c.total_volume),
        change_24h_pct:ch24,change_7d_pct:ch7,change_30d_pct:ch30,
        opportunity_score:s.score,
        label:'Most Lucrative Potential',
        reasons:reasons.slice(0,3),
        risk_note:s.risk_note
      };
    })
    .sort((a,b)=>b.opportunity_score-a.opportunity_score)
    .slice(0,6);
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
  try{
    const [markets,generalNews,upgradeNews,solanaNews]=await Promise.all([
      fetchMarkets(),
      fetchNews('cryptocurrency market Bitcoin Ethereum Solana major move adoption regulation',7),
      fetchNews('cryptocurrency protocol upgrade mainnet launch integration token upgrade blockchain',7),
      fetchNews('site:solana.com Solana changelog upgrade Firedancer Agave mainnet',5)
    ]);

    const market=classifyMarket(markets);
    const leaders=lucrativeWatchlist(markets);
    const moves=unusualMoves(markets);
    const major=markets.filter(c=>['bitcoin','ethereum','solana'].includes(c.id)).map(c=>({
      id:c.id,name:c.name,symbol:String(c.symbol||'').toUpperCase(),price_usd:money(c.current_price),
      change_24h_pct:pct(c.price_change_percentage_24h),
      change_7d_pct:pct(c.price_change_percentage_7d_in_currency),
      change_30d_pct:pct(c.price_change_percentage_30d_in_currency)
    }));

    res.status(200).json({
      report_name:'MOSES Report',
      agent:'MOSES — Market Observation & Strategy Evaluation Specialist',
      updated:new Date().toISOString(),
      market,
      major_assets:major,
      unusual_moves:moves,
      most_lucrative_potential:leaders,
      catalyst_radar:[...upgradeNews,...solanaNews].slice(0,10),
      market_news:generalNews,
      methodology:{
        note:'Most Lucrative Potential is a research ranking, not a prediction or guarantee of profit.',
        factors:['market liquidity','24h trading activity','24h/7d/30d momentum','market-cap profile','extreme-volatility penalty'],
        creator_claims:'Creator statements are treated as claims until independently verified.'
      }
    });
  }catch(e){
    res.status(200).json({
      report_name:'MOSES Report',
      updated:new Date().toISOString(),
      error:'MOSES market feed is temporarily unavailable.',
      market:{condition:'Data reconnecting',tone:'neutral',explanation:'Live market inputs could not be refreshed.'},
      major_assets:[],unusual_moves:[],most_lucrative_potential:[],catalyst_radar:[],market_news:[]
    });
  }
};