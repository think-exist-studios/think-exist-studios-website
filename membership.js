(()=>{
 const sb=window.supabase.createClient(
   'https://aivziwaudzuzwlkjmuly.supabase.co',
   'sb_publishable_07ChHzoUQS98-PHaxbNx2g_zmZ2QXeP'
 );
 let session=null,member=null,creator=null;

 const $=id=>document.getElementById(id);
 const toggle=(id,show)=>{const el=$(id);if(el)el.classList.toggle('hide',!show);};
 const text=(id,value)=>{const el=$(id);if(el)el.textContent=value??'';};
 const shortId=id=>id?('TE-'+id.split('-')[0].toUpperCase()):'—';

 async function ensureMember(user){
   if(!user)return;
   await sb.from('site_members').upsert({
     user_id:user.id,
     email:user.email||null,
     display_name:user.user_metadata?.display_name||user.email?.split('@')[0]||'Member'
   },{onConflict:'user_id',ignoreDuplicates:true});
 }

 async function loadNotifications(){
   const box=$('memberNotificationList');
   if(!box||!session?.user)return;
   const {data,error}=await sb.from('member_notifications')
     .select('id,title,message,kind,link_url,read_at,created_at')
     .order('created_at',{ascending:false})
     .limit(30);
   if(error){box.innerHTML='<p class="statusline">Updates are temporarily unavailable.</p>';return;}
   const rows=data||[];
   if(!rows.length){box.innerHTML='<p class="statusline">No notifications yet.</p>';return;}
   box.innerHTML=rows.map(n=>{
     const unread=n.read_at?'':' unread';
     const link=n.link_url?'<a class="feature-link" href="'+String(n.link_url).replace(/"/g,'&quot;')+'">Open update →</a>':'';
     return '<article class="member-notice'+unread+'" data-id="'+n.id+'"><div><small>'+String(n.kind||'update').toUpperCase()+'</small><strong>'+escapeHtml(n.title)+'</strong><p>'+escapeHtml(n.message)+'</p><span>'+new Date(n.created_at).toLocaleString()+'</span></div><div class="member-notice-actions">'+link+(n.read_at?'':'<button class="btn member-mark-read" type="button">Mark read</button>')+'</div></article>';
   }).join('');
   box.querySelectorAll('.member-mark-read').forEach(btn=>btn.addEventListener('click',async()=>{
     const row=btn.closest('.member-notice');
     await sb.rpc('mark_member_notification_read',{notification_id:row.dataset.id});
     await loadNotifications();
   }));
 }

 function escapeHtml(s){
   return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 }

 async function refresh(){
   const {data:{session:s}}=await sb.auth.getSession();
   session=s; member=null; creator=null;
   if(session?.user){
     await ensureMember(session.user);
     const [m,c]=await Promise.all([
       sb.from('site_members').select('display_name,membership_tier,status,email,created_at').eq('user_id',session.user.id).maybeSingle(),
       sb.from('studio_contributors').select('slug,display_name,role_title').maybeSingle()
     ]);
     member=m.data||null;
     creator=c.data||null;
   }
   paint();
   if(session?.user)await loadNotifications();
 }

 function paint(){
   const signed=Boolean(session?.user);
   toggle('memberLoginBtn',!signed);
   toggle('memberLogoutBtn',signed);
   toggle('memberJoinBtn',!signed);
   toggle('membershipForms',!signed);
   toggle('memberHub',signed);

   if(!signed){
     text('memberStateLabel','Guest');
     text('memberStateDetail','Free Think Exist membership is available.');
     return;
   }

   const name=member?.display_name||session.user.user_metadata?.display_name||session.user.email?.split('@')[0]||'Member';
   text('memberStateLabel','Member: '+name);
   text('memberStateDetail',(member?.membership_tier||'free').toUpperCase()+' membership · '+(session.user.email||''));
   text('membershipAccountName',name);
   text('membershipAccountEmail',session.user.email||'');
   text('membershipTier',(member?.membership_tier||'free').toUpperCase());
   text('membershipStatus',(member?.status||'active').toUpperCase());
   text('accountReference',shortId(session.user.id));
   text('accountReferenceFull',session.user.id);
   text('accountJoined',member?.created_at?new Date(member.created_at).toLocaleDateString():'—');
   text('creatorAccess',creator?((creator.role_title||'Creator')+' · '+creator.slug):'Regular member');
   const creatorLink=$('creatorAccessLink');
   if(creatorLink)creatorLink.classList.toggle('hide',!creator);
 }

 async function signOut(){
   await sb.auth.signOut();
   session=null;member=null;creator=null;
   paint();
   text('membershipStatusLine','Logged out.');
 }

 $('memberLogoutBtn')?.addEventListener('click',signOut);
 $('membershipLogoutBtn')?.addEventListener('click',signOut);
 $('memberLoginBtn')?.addEventListener('click',()=>location.href='membership.html#login');

 $('copyAccountReference')?.addEventListener('click',async()=>{
   if(!session?.user)return;
   try{
     await navigator.clipboard.writeText(session.user.id);
     text('accountReferenceStatus','Account reference copied.');
   }catch(e){text('accountReferenceStatus','Could not copy automatically.');}
 });

 $('memberLoginForm')?.addEventListener('submit',async e=>{
   e.preventDefault();
   text('membershipStatusLine','Logging in…');
   const email=$('memberLoginEmail').value.trim();
   const password=$('memberLoginPassword').value;
   const {error}=await sb.auth.signInWithPassword({email,password});
   if(error){text('membershipStatusLine',error.message);return;}
   text('membershipStatusLine','Welcome back.');
   await refresh();
 });

 $('memberSignupForm')?.addEventListener('submit',async e=>{
   e.preventDefault();
   text('membershipStatusLine','Creating your free membership…');
   const display_name=$('memberSignupName').value.trim();
   const email=$('memberSignupEmail').value.trim();
   const password=$('memberSignupPassword').value;
   const {data,error}=await sb.auth.signUp({email,password,options:{data:{display_name}}});
   if(error){text('membershipStatusLine',error.message);return;}
   if(data.session){
     text('membershipStatusLine','Membership created. You are logged in.');
     await refresh();
   }else{
     text('membershipStatusLine','Membership created. Check your email to confirm your account, then log in.');
   }
 });

 sb.auth.onAuthStateChange(()=>setTimeout(refresh,0));
 refresh();
})();