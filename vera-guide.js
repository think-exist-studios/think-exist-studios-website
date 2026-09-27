(()=>{
 const VERA_IMAGE='data:image/webp;base64,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';
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