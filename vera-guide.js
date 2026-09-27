(()=>{
 const VERA_IMAGE='/assets/vera.webp?v=4';
 const facts={
  home:[
   'VERA here. I stand for Versatile Ethical Reasoning Assistant.',
   'The studio now uses dedicated pages for projects, people, games, media and creator tools.',
   'The Unfinished is a Think Exist Studios game project.',
   'Tap me whenever I appear and I will swap the fact.',
   'Need more room? Minimize my tip, or hide me for this browsing session and reopen me from the VERA button.'
  ],
  games:[
   'The Unfinished is developed under Think Exist Studios.',
   'The game prototype already tracks health, damage and respawning.',
   'Sir Barely and Sir Almost can already be switched in the Godot prototype.',
   'The current prototype uses Godot 4 compatibility rendering for mobile-minded development.',
   'A private development workspace is never the same thing as a public playable deployment.',
   'Steam public broadcasts are available through Steam itself; the Game Lab links there rather than pretending native Steam playback is embedded.'
  ],
  discover:[
   'The word robot entered popular culture through Karel Čapek’s 1920 play R.U.R.',
   'Anime is simply the Japanese word used for animation.',
   'A feed can be live without being noisy. Fresh data plus good pacing beats clutter.',
   'Try the video shuffle button. I approve of controlled chaos.',
   'The Discover page also carries the official @ThinkExistHQ Live X feed.'
  ],
  art:[
   'The Art Radar mixes public-domain museum artwork, artist headlines, and current NFT trends.',
   'Artwork images on this page are limited to public-domain collection items from the Art Institute of Chicago feed.',
   'Trending NFT data is discovery information, not a recommendation to buy.',
   'Use the refresh button whenever you want a new snapshot of the art and NFT feeds.'
  ],
  watch:[
   'Think Exist Watch supports playable video from YouTube, TikTok, Twitch, Vimeo, Dailymotion and PeerTube.',
   'The Art page stays available from the main navigation while you browse Watch.',
   'Use the source tabs on Watch to switch platforms without leaving the Think Exist site.',
   'The feed refreshes from selected YouTube channels without exposing your private account data.'
  ],
  crypto:[
   'Quick safety fact: a legitimate website never needs your wallet seed phrase.',
   'New to crypto? The Start Here guide explains buying, custody, transfers and wallet safety step by step.',
   'DEX Screener charts are third-party market data. A chart appearing on the page is not an endorsement.',
   'Use the copyable beginner checklist, but never type a real seed phrase or private key into the website.',
   'Market prices can move faster than a page refresh, so treat snapshots as informational.',
   'Official links matter. Verify the destination before connecting a wallet.',
   'Blockchain 101 rotates through a short beginner lesson and quiz each day.'
  ],
  creator:[
   'Creator Studio separates publishing tools from the public portfolio pages.',
   'Good portfolio entries answer three things quickly: what it is, what you did, and where to see more.',
   'Draft first when you are unsure. Publish when the presentation is ready.'
  ],
  people:[
   'A creator page should credit the person clearly before the project.',
   'A strong portfolio shows finished work and the thinking behind it.'
  ]
 };
 const page=document.body.dataset.page || (location.pathname.includes('crypto')?'crypto':location.pathname.includes('creator')?'creator':location.pathname.includes('/people/')?'people':'home');
 const pool=facts[page]||facts.home;
 let idx=Math.floor(Math.random()*pool.length), timer;
 const root=document.createElement('aside');
 root.className='vera-guide';
 root.setAttribute('aria-label','VERA website guide');
 root.innerHTML='<div class="vera-bubble" role="status" aria-live="polite"><div class="vera-controls"><button class="vera-minimize" type="button" aria-label="Minimize VERA tip">−</button><button class="vera-close" type="button" aria-label="Hide VERA for this session">×</button></div><strong>VERA SAYS</strong><p></p></div><button class="vera-character" type="button" aria-label="Ask VERA for another fact"><img alt="VERA, Think Exist Studios AI Systems Guardian"></button>';
 const launcher=document.createElement('button');
 launcher.className='vera-launcher';
 launcher.type='button';
 launcher.setAttribute('aria-label','Show VERA');
 launcher.textContent='VERA';
 document.body.append(root,launcher);

 const bubble=root.querySelector('.vera-bubble'), text=bubble.querySelector('p'), char=root.querySelector('.vera-character'), close=root.querySelector('.vera-close'), minimize=root.querySelector('.vera-minimize');
 const img=char.querySelector('img');
 img.src=VERA_IMAGE;
 img.addEventListener('load',()=>char.classList.add('vera-image-ready'),{once:true});
 img.addEventListener('error',()=>{img.hidden=true;char.classList.add('vera-image-fallback')},{once:true});

 const getHidden=()=>{try{return sessionStorage.getItem('thinkexist-vera-hidden')==='1'}catch(e){return false}};
 const setHidden=v=>{try{v?sessionStorage.setItem('thinkexist-vera-hidden','1'):sessionStorage.removeItem('thinkexist-vera-hidden')}catch(e){}};

 function say(){
   text.textContent=pool[idx++%pool.length];
   bubble.classList.add('show');
   clearTimeout(timer);
   timer=setTimeout(()=>bubble.classList.remove('show'),10000);
 }
 function hideVera(){
   clearTimeout(timer);
   bubble.classList.remove('show');
   root.classList.add('is-hidden');
   launcher.classList.add('show');
   setHidden(true);
 }
 function showVera(){
   root.classList.remove('is-hidden');
   launcher.classList.remove('show');
   setHidden(false);
   say();
 }
 char.addEventListener('click',say);
 minimize.addEventListener('click',e=>{e.stopPropagation();clearTimeout(timer);bubble.classList.remove('show')});
 close.addEventListener('click',e=>{e.stopPropagation();hideVera()});
 launcher.addEventListener('click',showVera);

 if(getHidden()){
   root.classList.add('is-hidden');
   launcher.classList.add('show');
 }else{
   setTimeout(say,900);
 }
})();