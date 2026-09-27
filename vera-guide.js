(()=>{
 const VERA_IMAGE='/assets/vera.webp';
 const facts={
  home:[
   'VERA here. I stand for Versatile Ethical Reasoning Assistant.',
   'Studio tip: Discover changes throughout the day, so it is worth checking twice.',
   'The Unfinished already has character switching between Sir Barely and Sir Almost.',
   'Tap me whenever I appear and I will swap the fact.'
  ],
  games:[
   'The game prototype already tracks health, damage and respawning.',
   'Sir Barely and Sir Almost can already be switched in the Godot prototype.',
   'The current prototype uses Godot 4 compatibility rendering for mobile-minded development.',
   'A private development workspace is never the same thing as a public playable deployment.'
  ],
  discover:[
   'The word robot entered popular culture through Karel Čapek’s 1920 play R.U.R.',
   'Anime is simply the Japanese word used for animation.',
   'A feed can be live without being noisy. Fresh data plus good pacing beats clutter.',
   'Try the video shuffle button. I approve of controlled chaos.'
  ],
  crypto:[
   'Quick safety fact: a legitimate website never needs your wallet seed phrase.',
   'Market prices can move faster than a page refresh, so treat snapshots as informational.',
   'Official links matter. Verify the destination before connecting a wallet.'
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
 let idx=Math.floor(Math.random()*pool.length), timer, moveTimer;
 const root=document.createElement('aside');root.className='vera-guide';root.setAttribute('aria-label','VERA website guide');
 root.innerHTML='<div class="vera-bubble" role="status" aria-live="polite"><button class="vera-close" aria-label="Hide VERA tip">×</button><strong>VERA SAYS</strong><p></p></div><button class="vera-character" aria-label="Ask VERA for another fact"><img alt="VERA, Think Exist Studios AI Systems Guardian"></button>';
 document.body.appendChild(root);
 const bubble=root.querySelector('.vera-bubble'), text=bubble.querySelector('p'), char=root.querySelector('.vera-character'), close=root.querySelector('.vera-close');
 char.querySelector('img').src=VERA_IMAGE;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clamp=(n,min,max)=>Math.min(Math.max(n,min),max);
 function placeBubble(){
   if(!bubble.classList.contains('show')) return;
   const w=innerWidth,h=innerHeight,r=root.getBoundingClientRect();
   const bw=Math.min(260,Math.max(210,w-24));
   bubble.style.width=bw+'px';
   bubble.style.left='12px';
   bubble.style.top='12px';
   const bh=bubble.offsetHeight||120;
   let left,top,side='right';
   if(w<=760){
     left=clamp((w-bw)/2,12,Math.max(12,w-bw-12));
     top=clamp(r.top-bh-14,12,Math.max(12,h-bh-12));
     side='center';
   }else{
     const leftSpace=r.left-18;
     const rightSpace=w-r.right-18;
     if(leftSpace>=bw || leftSpace>=rightSpace){
       left=r.left-bw-16;
       side='left';
     }else{
       left=r.right+16;
       side='right';
     }
     left=clamp(left,12,Math.max(12,w-bw-12));
     top=clamp(r.top+18,12,Math.max(12,h-bh-12));
   }
   bubble.style.left=left+'px';
   bubble.style.top=top+'px';
   bubble.dataset.side=side;
 }
 function say(){
   text.textContent=pool[idx++%pool.length];
   bubble.classList.add('show');
   requestAnimationFrame(placeBubble);
   clearTimeout(timer);timer=setTimeout(()=>bubble.classList.remove('show'),9000);
 }
 function move(){
   const w=innerWidth,h=innerHeight;
   const rw=root.offsetWidth||170,rh=root.offsetHeight||220;
   if(reduced || w<=760){
     const x=clamp(w-rw-10,8,Math.max(8,w-rw-8));
     const y=clamp(h-rh-10,76,Math.max(76,h-rh-8));
     root.style.left=x+'px';
     root.style.top=y+'px';
     root.style.right='auto';
     root.style.bottom='auto';
     requestAnimationFrame(placeBubble);
     return;
   }
   const margin=16,topMin=92;
   const maxX=Math.max(margin,w-rw-margin);
   const maxY=Math.max(topMin,h-rh-margin);
   const pts=[[margin,maxY],[maxX,maxY],[maxX,topMin],[margin,topMin],[clamp(w*.55,margin,maxX),maxY]];
   const p=pts[Math.floor(Math.random()*pts.length)];
   root.style.left=clamp(p[0],margin,maxX)+'px';
   root.style.top=clamp(p[1],topMin,maxY)+'px';
   root.style.right='auto';
   root.style.bottom='auto';
   requestAnimationFrame(placeBubble);
 }
 function roam(){
   move();if(Math.random()>.25)say();
   clearTimeout(moveTimer);moveTimer=setTimeout(roam,15000+Math.random()*9000);
 }
 char.addEventListener('click',()=>{say();if(!reduced&&innerWidth>760)move()});
 close.addEventListener('click',e=>{e.stopPropagation();bubble.classList.remove('show')});
 setTimeout(()=>{move();say();},900);
 if(!reduced&&innerWidth>760)moveTimer=setTimeout(roam,14000);
 addEventListener('resize',()=>{move();requestAnimationFrame(placeBubble)},{passive:true});
})();