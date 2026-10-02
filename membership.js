(()=>{
 const sb=window.supabase.createClient(
   'https://aivziwaudzuzwlkjmuly.supabase.co',
   'sb_publishable_07ChHzoUQS98-PHaxbNx2g_zmZ2QXeP'
 );
 let session=null,member=null,creator=null;
 let creatorConversations=[],activeCreatorConversation=null,creatorThreadChannel=null;

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


 async function loadCreatorConversations(){
   const box=$('memberCreatorConversationList');
   if(!box||!session?.user)return;
   const {data,error}=await sb.from('creator_conversations')
     .select('id,creator_slug,kind,subject,request_details,status,created_at')
     .eq('member_user_id',session.user.id)
     .order('created_at',{ascending:false});
   if(error){box.innerHTML='<p class="statusline">Creator messages are temporarily unavailable.</p>';return;}
   creatorConversations=data||[];
   let allMessages=[];
   if(creatorConversations.length){
     const ids=creatorConversations.map(x=>x.id);
     const res=await sb.from('creator_messages')
       .select('conversation_id,sender_role,body,created_at,read_at')
       .in('conversation_id',ids)
       .order('created_at',{ascending:false});
     allMessages=res.data||[];
   }
   const creatorName=slug=>slug==='cash-cassius-miller'?'Cash (Cassius) Miller':String(slug||'Creator').split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
   if(!creatorConversations.length){
     box.innerHTML='<p class="statusline">No creator conversations yet. Open a creator profile to send a message or project request.</p>';
     $('memberCreatorThread').innerHTML='<div class="creator-thread-empty">Your creator conversations will appear here.</div>';
     $('memberCreatorReplyForm').classList.add('hide');
     return;
   }
   box.innerHTML=creatorConversations.map(c=>{
     const msgs=allMessages.filter(m=>m.conversation_id===c.id);
     const unread=msgs.filter(m=>m.sender_role==='creator'&&!m.read_at).length;
     const last=msgs[0]?.body||((c.kind==='commission'?'Project request':'Conversation')+' started');
     return '<button class="creator-conversation-row'+(activeCreatorConversation?.id===c.id?' active':'')+'" type="button" data-id="'+escapeHtml(c.id)+'"><div class="creator-conversation-top"><strong>'+escapeHtml(creatorName(c.creator_slug))+'</strong><span class="creator-kind">'+escapeHtml(c.kind==='commission'?'PROJECT':'MESSAGE')+'</span></div><span>'+escapeHtml(c.subject||'Direct message')+'</span><small>'+escapeHtml(last.slice(0,90))+'</small>'+(unread?'<b class="creator-unread">'+unread+'</b>':'')+'</button>';
   }).join('');
   box.querySelectorAll('.creator-conversation-row').forEach(btn=>btn.addEventListener('click',()=>openMemberCreatorConversation(btn.dataset.id)));
   if(activeCreatorConversation){
     const refreshed=creatorConversations.find(c=>c.id===activeCreatorConversation.id);
     if(refreshed)activeCreatorConversation=refreshed;
   }else if(creatorConversations[0]){
     await openMemberCreatorConversation(creatorConversations[0].id,false);
   }
 }

 async function openMemberCreatorConversation(id,reloadList=true){
   const c=creatorConversations.find(x=>x.id===id);
   if(!c)return;
   activeCreatorConversation=c;
   const creatorName=c.creator_slug==='cash-cassius-miller'?'Cash (Cassius) Miller':String(c.creator_slug||'Creator').split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
   $('memberCreatorThreadHeader').innerHTML='<div><div class="eyebrow">'+escapeHtml(c.kind==='commission'?'Project request':'Direct message')+'</div><h3>'+escapeHtml(creatorName)+'</h3><p>'+escapeHtml(c.subject||'Direct message')+' · '+escapeHtml(c.status)+'</p></div>';
   await sb.from('creator_messages').update({read_at:new Date().toISOString()})
     .eq('conversation_id',id).eq('sender_role','creator').is('read_at',null);
   await renderMemberCreatorThread(id);
   $('memberCreatorReplyForm').classList.toggle('hide',c.status!=='open');
   if(c.status!=='open')text('memberCreatorReplyStatus','This conversation is closed.');
   else text('memberCreatorReplyStatus','');
   subscribeMemberCreatorThread(id);
   if(reloadList)await loadCreatorConversations();
 }

 async function renderMemberCreatorThread(id){
   const {data,error}=await sb.from('creator_messages').select('id,sender_role,body,created_at').eq('conversation_id',id).order('created_at',{ascending:true});
   if(error){$('memberCreatorThread').innerHTML='<div class="creator-thread-empty">Could not load this conversation.</div>';return;}
   const rows=data||[];
   $('memberCreatorThread').innerHTML=rows.length?rows.map(m=>{
     const who=m.sender_role==='member'?'You':'Creator';
     return '<article class="creator-message '+escapeHtml(m.sender_role)+'"><div class="creator-message-meta"><strong>'+who+'</strong><span>'+new Date(m.created_at).toLocaleString()+'</span></div><p>'+escapeHtml(m.body)+'</p></article>';
   }).join(''):'<div class="creator-thread-empty">No messages in this conversation yet.</div>';
   $('memberCreatorThread').scrollTop=$('memberCreatorThread').scrollHeight;
 }

 function subscribeMemberCreatorThread(id){
   if(creatorThreadChannel)sb.removeChannel(creatorThreadChannel);
   creatorThreadChannel=sb.channel('member-hub-'+id)
     .on('postgres_changes',{event:'INSERT',schema:'public',table:'creator_messages',filter:'conversation_id=eq.'+id},async()=>{await renderMemberCreatorThread(id);await loadCreatorConversations();})
     .subscribe();
 }

 $('memberCreatorReplyForm')?.addEventListener('submit',async e=>{
   e.preventDefault();
   if(!session?.user||!activeCreatorConversation||activeCreatorConversation.status!=='open')return;
   const body=$('memberCreatorReplyBody').value.trim();
   if(!body)return;
   text('memberCreatorReplyStatus','Sending…');
   const {error}=await sb.from('creator_messages').insert({
     conversation_id:activeCreatorConversation.id,
     sender_user_id:session.user.id,
     sender_role:'member',
     body
   });
   if(error){text('memberCreatorReplyStatus','Could not send: '+error.message);return;}
   $('memberCreatorReplyBody').value='';
   text('memberCreatorReplyStatus','Sent.');
   await renderMemberCreatorThread(activeCreatorConversation.id);
   await loadCreatorConversations();
 });

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
   if(session?.user)await Promise.all([loadNotifications(),loadCreatorConversations()]);
 }

 function paint(){
   const signed=Boolean(session?.user);
   toggle('memberLoginBtn',!signed);
   toggle('memberLogoutBtn',signed);
   toggle('memberJoinBtn',!signed);
   toggle('memberAccountBtn',signed);
   toggle('membershipForms',!signed);
   toggle('memberHub',signed);
   const dot=$('homeMemberDot'); if(dot)dot.classList.toggle('online',signed);

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
   if(creatorThreadChannel){await sb.removeChannel(creatorThreadChannel);creatorThreadChannel=null;}
   await sb.auth.signOut();
   session=null;member=null;creator=null;creatorConversations=[];activeCreatorConversation=null;
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
   const {data,error}=await sb.auth.signUp({email,password,options:{data:{display_name},emailRedirectTo:location.origin+'/membership.html'}});
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