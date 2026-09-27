(() => {
  const root=document.getElementById('novaMentor'); if(!root||!window.supabase)return;
  const sb=window.supabase.createClient('https://aivziwaudzuzwlkjmuly.supabase.co','sb_publishable_07ChHzoUQS98-PHaxbNx2g_zmZ2QXeP');
  const $=id=>document.getElementById(id);
  const messages=$('novaMessages'), status=$('novaStatus'), creatorStatus=$('novaCreatorStatus');
  const input=$('novaInput'), imageInput=$('novaImage'), attachment=$('novaAttachment'), attachmentPreview=$('novaAttachmentPreview'), attachmentName=$('novaAttachmentName');
  let session=null, contributor=null, mode='mentor', busy=false, pendingFile=null, currentSnapshot=null;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cacheKey=()=>contributor?'nova-offline:'+contributor.slug:null;
  const queueKey=()=>contributor?'nova-pending:'+contributor.slug:null;
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}};
  const saveCache=(payload)=>{const key=cacheKey();if(!key)return;try{localStorage.setItem(key,JSON.stringify({...payload,saved_at:new Date().toISOString()}))}catch{}};
  const timeLabel=v=>{try{return new Date(v).toLocaleString()}catch{return''}};

  function setMode(next){
    mode=next;
    root.querySelectorAll('.nova-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    input.placeholder=mode==='critique'?'Tell NOVA what you want feedback on, then attach your artwork…':mode==='lesson'?'What would you like NOVA to teach you?':mode==='idea'?'What idea are you working through?':mode==='business'?'Ask about pricing, audience, commissions, publishing, products, or creator business…':mode==='visual'?'Describe the drawing lesson or visual example you want NOVA to create…':'Ask NOVA about your art, project, portfolio, ideas, or creator business…';
  }

  function typing(on){
    messages.querySelector('.nova-typing-wrap')?.remove();
    if(!on)return;
    const el=document.createElement('div');el.className='nova-msg nova nova-typing-wrap';el.innerHTML='<div class="nova-typing" aria-label="NOVA is typing"><i></i><i></i><i></i></div><small>NOVA is thinking…</small>';messages.appendChild(el);messages.scrollTop=messages.scrollHeight;
  }

  async function signed(path){
    if(!path)return null;
    const {data}=await sb.storage.from('nova-creator-assets').createSignedUrl(path,3600);
    return data?.signedUrl||null;
  }

  async function renderHistory(rows,offline=false){
    if(!rows?.length){
      messages.innerHTML='<div class="nova-empty"><strong>Meet NOVA.</strong><br>Tell her what kind of creator you are, what you are working on, and what you want to improve. She will learn your creator preferences over time.</div>';
      return;
    }
    const view=await Promise.all(rows.map(async r=>({...r,_url:r.image_path?await signed(r.image_path):null})));
    messages.innerHTML=view.map(r=>{
      const who=r.role==='creator'?'You':'NOVA';
      const img=r._url?'<img src="'+esc(r._url)+'" alt="'+(r.role==='creator'?'Artwork shared with NOVA':'NOVA teaching visual')+'">':'';
      return '<article class="nova-msg '+(r.role==='creator'?'creator':'nova')+'">'+img+'<div>'+esc(r.content||'')+'</div><small>'+who+' · '+esc(timeLabel(r.created_at))+(offline?' · offline cache':'')+'</small></article>';
    }).join('');
    messages.scrollTop=messages.scrollHeight;
  }

  function renderMemory(snapshot,offline=false){
    currentSnapshot=snapshot||currentSnapshot;
    const profile=snapshot?.profile||{};
    $('novaProfileSummary').textContent=profile.profile_summary||'NOVA will build a creator profile naturally as you talk.';
    const memory=snapshot?.memory||[];
    const counts={}; memory.forEach(m=>counts[m.compartment]=(counts[m.compartment]||0)+1);
    $('novaMemoryChips').innerHTML=Object.keys(counts).length?Object.entries(counts).map(([k,v])=>'<span class="nova-memory-chip">'+esc(k.replaceAll('_',' '))+' <b>'+v+'</b></span>').join(''):'<span class="nova-memory-chip">No saved creator memories yet</span>';
    const images=snapshot?.images?.length||0;
    $('novaOfflineStatus').textContent=(offline?'Using local offline snapshot · ':'Synced online · ')+memory.length+' memories · '+images+' image reference'+(images===1?'':'s')+' · saved privately for '+(contributor?.display_name||'this creator');
  }

  function renderReview(r){
    const box=$('novaReview');
    if(!r){box.innerHTML='<p class="statusline">No NOVA professional review yet.</p>';return;}
    const dims=[['Craft',r.craft_score],['Storytelling',r.storytelling_score],['Consistency',r.consistency_score],['Presentation',r.presentation_score],['Business',r.business_readiness_score]];
    const priorities=Array.isArray(r.priorities)?r.priorities:[];
    box.innerHTML='<div class="nova-review-score"><strong>'+Number(r.overall_score||0)+'</strong><span>/ 100 professional readiness</span></div><div class="nova-review-grid">'+dims.map(x=>'<div><small>'+x[0]+'</small><b>'+Number(x[1]||0)+'</b></div>').join('')+'</div><p>'+esc(r.narrative||'')+'</p>'+(priorities.length?'<strong>Next priorities</strong><ul class="nova-review-list">'+priorities.slice(0,5).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'<small class="statusline">Private review · '+esc(timeLabel(r.created_at))+'</small>';
  }

  async function loadAll(){
    const {data:{session:s}}=await sb.auth.getSession(); session=s;
    if(!session){creatorStatus.textContent='Sign in to use your private NOVA workspace.';messages.innerHTML='<div class="nova-empty">NOVA becomes available after creator sign-in.</div>';return;}
    const {data:c}=await sb.from('studio_contributors').select('slug,email,display_name,role_title').maybeSingle();
    if(!c){creatorStatus.textContent='Creator access required.';return;}
    contributor=c; creatorStatus.textContent='Mentoring '+c.display_name+' · '+(c.role_title||'Creator');
    const cached=readJson(cacheKey(),null);
    if(cached?.history?.length){await renderHistory(cached.history,true);if(cached.snapshot)renderMemory(cached.snapshot,true);if(cached.review)renderReview(cached.review);}
    try{
      const [{data:history,error:hErr},{data:reviews}]=await Promise.all([
        sb.from('nova_conversation_messages').select('role,content,message_kind,image_path,created_at').eq('contributor_slug',c.slug).order('created_at',{ascending:true}).limit(80),
        sb.from('nova_portfolio_reviews').select('*').eq('contributor_slug',c.slug).order('created_at',{ascending:false}).limit(1)
      ]);
      if(hErr)throw hErr;
      const snap=await sb.functions.invoke('nova-mentor',{body:{action:'memory_snapshot'}});
      if(snap.error||snap.data?.error)throw new Error(snap.data?.error||snap.error?.message||'Snapshot unavailable');
      await renderHistory(history||[]);
      renderMemory(snap.data||{});
      const review=reviews?.[0]||null;renderReview(review);
      saveCache({history:history||[],snapshot:snap.data||{},review});
      status.textContent='NOVA is online. Creator memory and image learning are isolated to '+c.display_name+'.';
      await flushQueue();
    }catch(e){
      status.textContent=cached?'NOVA is temporarily offline. Showing the last local creator snapshot.':'NOVA could not sync right now.';
      if(!cached){messages.innerHTML='<div class="nova-empty">NOVA could not sync. Your Creator Studio portfolio is still available.</div>';}
    }
  }

  function queueText(text,queuedMode){
    const key=queueKey();const q=readJson(key,[]);q.push({text,mode:queuedMode,created_at:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(q));
    status.textContent='Saved offline. NOVA will receive this text when your connection returns.';
  }
  async function flushQueue(){
    if(!navigator.onLine||!contributor||busy)return;
    const key=queueKey(), q=readJson(key,[]); if(!q.length)return;
    for(const item of [...q]){
      try{
        const {data,error}=await sb.functions.invoke('nova-mentor',{body:{action:'chat',message:item.text,mode:item.mode}});
        if(error||data?.error)break;
        q.shift();localStorage.setItem(key,JSON.stringify(q));
      }catch{break}
    }
    if(!q.length){localStorage.removeItem(key);await loadAll();}
  }

  async function uploadPending(){
    if(!pendingFile)return null;
    const cleanName=pendingFile.name.replace(/[^a-zA-Z0-9._-]/g,'-');
    const path=session.user.id+'/'+contributor.slug+'/uploads/'+Date.now()+'-'+cleanName;
    const {error}=await sb.storage.from('nova-creator-assets').upload(path,pendingFile,{upsert:false,contentType:pendingFile.type});
    if(error)throw error;
    return path;
  }

  async function send(text){
    text=String(text||'').trim();
    if(!text&&!pendingFile){status.textContent='Type a message or attach artwork first.';return;}
    if(!navigator.onLine){
      if(pendingFile){status.textContent='Artwork analysis needs a connection. Your text can still be saved offline.';}
      if(text)queueText(text,mode);
      input.value='';
      return;
    }
    if(busy)return;busy=true;$('novaSend').disabled=true;typing(true);
    try{
      const imagePath=await uploadPending();
      let result;
      if(mode==='visual'){
        if(imagePath)throw new Error('Visual Lesson creates a new teaching image from your text; switch to Critique to analyze uploaded artwork.');
        result=await sb.functions.invoke('nova-mentor',{body:{action:'generate_visual',prompt:text}});
      }else{
        result=await sb.functions.invoke('nova-mentor',{body:{action:'chat',message:text,mode,imagePath}});
      }
      if(result.error||result.data?.error)throw new Error(result.data?.error||result.error?.message||'NOVA could not respond.');
      input.value='';clearAttachment();status.textContent='NOVA updated your private creator memory.';await loadAll();
    }catch(e){status.textContent=e?.message||'NOVA could not respond right now.';}
    finally{typing(false);busy=false;$('novaSend').disabled=false;}
  }

  async function runReview(){
    if(busy)return;busy=true;$('novaRunReview').disabled=true;$('novaReviewStatus').textContent='NOVA is reviewing the portfolio evidence against professional benchmarks…';
    try{
      const {data,error}=await sb.functions.invoke('nova-mentor',{body:{action:'portfolio_review'}});
      if(error||data?.error)throw new Error(data?.error||error?.message||'Review failed');
      renderReview(data.review);$('novaReviewStatus').textContent='Review saved privately. Use NOVA chat to discuss any score or priority.';
      const cached=readJson(cacheKey(),{});saveCache({...cached,review:data.review});
    }catch(e){$('novaReviewStatus').textContent=e?.message||'NOVA could not run the review right now.';}
    finally{busy=false;$('novaRunReview').disabled=false;}
  }

  function clearAttachment(){pendingFile=null;imageInput.value='';attachment.classList.add('hide');attachmentPreview.removeAttribute('src');}
  imageInput.addEventListener('change',()=>{
    const f=imageInput.files?.[0];if(!f)return;
    if(f.size>10*1024*1024){status.textContent='Use an image under 10 MB.';imageInput.value='';return;}
    pendingFile=f;attachmentName.textContent=f.name;attachmentPreview.src=URL.createObjectURL(f);attachment.classList.remove('hide');if(mode==='mentor')setMode('critique');
  });
  $('novaRemoveAttachment').addEventListener('click',clearAttachment);
  $('novaForm').addEventListener('submit',e=>{e.preventDefault();send(input.value);});
  root.querySelectorAll('.nova-mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  root.querySelectorAll('#novaStarters button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode)setMode(b.dataset.mode);input.value=b.dataset.prompt||'';input.focus();}));
  $('novaRunReview').addEventListener('click',runReview);
  window.addEventListener('online',()=>{status.textContent='Connection restored. Syncing NOVA…';flushQueue();});
  window.addEventListener('offline',()=>{status.textContent='Offline mode. Text can be saved locally until you reconnect.';});
  sb.auth.onAuthStateChange(()=>setTimeout(loadAll,50));
  loadAll();
})();