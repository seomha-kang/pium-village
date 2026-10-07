'use strict';
(() => {
 const $=s=>document.querySelector(s), canvas=$('#world'), ctx=canvas.getContext('2d'), dialog=$('#dialog');
 const KEY='pium-heart-village-v1', validIds=new Set(VILLAGE.map(b=>b.id));
 let completed=new Set(), storageAvailable=true;
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');if(Array.isArray(raw.completed))completed=new Set(raw.completed.filter(id=>validIds.has(id)));}catch{storageAvailable=false;}
 let playing=false, current=null, stage=0, screen='start', pendingEnding=false, answered=false, near=null;
 let w=0,h=0,scale=1,camX=0,camY=0,last=0,walkTime=0,joy={x:0,y:0},joyPointer=null;
 const player={x:514,y:772},keys=new Set(), map=new Image(),sprite=new Image();
 map.src='./village-map.png';sprite.src='./protagonist.png';
 map.onerror=()=>toast('마을 이미지를 불러오지 못했어요. 연결을 확인하고 새로고침해 주세요.');
 sprite.onload=()=>{$('.hero-pium').src=sprite.src;$('.hero-pium').classList.add('ready');};
 sprite.onerror=()=>{sprite.src='./pium-original.png';sprite.onerror=null;};
 function save(){try{localStorage.setItem(KEY,JSON.stringify({completed:[...completed]}));}catch{storageAvailable=false;toast('이 브라우저에서는 진행 상황이 저장되지 않아요. 지금 플레이는 계속할 수 있어요.');}}
 function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,4500);}
 function hud(){const n=completed.size;$('#count').textContent=`${n} / 5`;$('#petals').textContent=Array.from({length:5},(_,i)=>i<n?'✿':'○').join(' ');$('#collection').setAttribute('aria-label',`마음의 꽃잎 ${n}개, 전체 5개. 모은 꽃잎 보기`);$('#start-button').innerHTML=n?'이어서 탐험하기 <span>✦</span>':'게임 시작 <span>✦</span>';if(!storageAvailable)$('#save-note').textContent='이 브라우저에서는 진행 상황이 저장되지 않을 수 있어요.';}
 function resetInput(){keys.clear();joy={x:0,y:0};joyPointer=null;$('#stick').style.transform='translate(0,0)';}
 function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.max(w/900,(h-160)/1536);}
 new ResizeObserver(resize).observe(canvas);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const obstacles=[...VILLAGE.map(b=>b.box),[406,532,213,152],[399,878,232,142],[120,516,99,62],[875,551,73,63],[887,1090,65,67]];
 const trees=[[90,92,45],[423,169,43],[677,62,40],[813,88,36],[920,145,32],[67,518,35],[952,511,40],[61,1066,32],[943,1074,38],[267,1290,41],[906,1343,41],[310,1464,65]];
 function blocked(x,y){if(x<46||x>978||y<110||y>1460)return true;if(y>1315&&x<210)return true;if(y<155&&x>875)return true;const r=17;return obstacles.some(([a,b,c,d])=>x+r>a&&x-r<a+c&&y+r>b&&y-r<b+d)||trees.some(([a,b,c])=>Math.hypot(x-a,y-b)<c+r);}
 function move(dx,dy,dt){const distance=Math.hypot(dx,dy);if(!distance)return;dx/=Math.max(1,distance);dy/=Math.max(1,distance);const step=140*dt,n=Math.max(1,Math.ceil(step/5));for(let i=0;i<n;i++){const nx=player.x+dx*step/n,ny=player.y+dy*step/n;if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;}walkTime+=dt*11;}
 function nearest(){return VILLAGE.find(b=>Math.hypot(player.x-b.door[0],player.y-b.door[1])<82)||null;}
 function updateNearby(){const next=nearest();if(next?.id===near?.id)return;near=next;$('#enter').disabled=!near;$('#enter').innerHTML=near?'입장<span>'+near.name+'</span>':'입장<span>문 가까이 가세요</span>';$('#nearby').textContent=near?`${completed.has(near.id)?'🌸':'✦'} ${near.name} · 입장할 수 있어요`:'꽃잎을 찾아 마을을 둘러보세요.';}
 function rounded(x,y,bw,bh,r){ctx.beginPath();ctx.roundRect(x,y,bw,bh,r);}
 function draw(time){ctx.clearRect(0,0,w,h);ctx.fillStyle='#a7ce76';ctx.fillRect(0,0,w,h);camX=clamp(player.x-w/scale/2,0,Math.max(0,1024-w/scale));camY=clamp(player.y-h*.44/scale,-240,Math.max(-240,1536-h*.44/scale));if(!playing){camX=(1024-w/scale)/2;camY=-100;}ctx.save();ctx.scale(scale,scale);ctx.translate(-camX,-camY);if(map.complete&&map.naturalWidth)ctx.drawImage(map,0,0,1024,1536);
  if(playing){for(const b of VILLAGE){ctx.beginPath();ctx.ellipse(b.door[0],b.door[1],32,12,0,0,Math.PI*2);ctx.fillStyle=near===b?'#fff4b1cc':'#fffce580';ctx.fill();ctx.lineWidth=2/scale;ctx.strokeStyle=near===b?'#477141':'#ffffffa0';ctx.stroke();}
   ctx.fillStyle='#27402c40';ctx.beginPath();ctx.ellipse(player.x,player.y,31,10,0,0,Math.PI*2);ctx.fill();const bob=(joy.x||joy.y||keys.size)?Math.sin(walkTime)*3:Math.sin(time/650)*1.5;if(sprite.complete&&sprite.naturalWidth)ctx.drawImage(sprite,player.x-56,player.y-104+bob,112,112);ctx.font=`bold ${12/scale}px 'Malgun Gothic',sans-serif`;ctx.textAlign='center';ctx.fillStyle='#234b36';ctx.strokeStyle='#fffdf3';ctx.lineWidth=3/scale;ctx.strokeText('피움이',player.x,player.y+30);ctx.fillText('피움이',player.x,player.y+30);
   for(const b of VILLAGE){const [x,y]=b.label;ctx.font=`bold ${14/scale}px 'Malgun Gothic',sans-serif`;const text=b.name,bw=ctx.measureText(text).width+27/scale,bh=29/scale;rounded(x-bw/2,y-bh/2,bw,bh,10/scale);ctx.fillStyle='#fffdf3f5';ctx.fill();ctx.lineWidth=1/scale;ctx.strokeStyle='#52694355';ctx.stroke();ctx.fillStyle='#294f35';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y);ctx.textBaseline='alphabetic';if(completed.has(b.id)){ctx.font=`${22/scale}px sans-serif`;ctx.fillText('🌸',x+bw/2-3/scale,y-17/scale);}}
  }ctx.restore();}
 function frame(t){const dt=Math.min((t-last)/1000||0,.04);last=t;if(playing&&!dialog.open&&!document.hidden){let dx=joy.x+(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0),dy=joy.y+(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);move(dx,dy,dt);updateNearby();}draw(t);requestAnimationFrame(frame);}
 const joyEl=$('#joystick');
 function joyMove(e){if(e.pointerId!==joyPointer)return;const r=joyEl.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),m=Math.min(len,36),a=len?m/len:0;joy={x:len<7?0:dx*a/36,y:len<7?0:dy*a/36};$('#stick').style.transform=`translate(${dx*a}px,${dy*a}px)`;e.preventDefault();}
 joyEl.addEventListener('pointerdown',e=>{if(dialog.open||!playing||joyPointer!==null)return;joyPointer=e.pointerId;joyEl.setPointerCapture(e.pointerId);joyMove(e);});joyEl.addEventListener('pointermove',joyMove);for(const event of ['pointerup','pointercancel','lostpointercapture'])joyEl.addEventListener(event,e=>{if(e.pointerId===joyPointer)resetInput();});
 window.addEventListener('keydown',e=>{if(!playing||dialog.open)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){e.preventDefault();keys.add(k);}if((k==='enter'||k===' ')&&!e.repeat&&near){e.preventDefault();enter();}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',resetInput);document.addEventListener('visibilitychange',resetInput);
 function open(title,kicker){resetInput();$('#dialog-title').textContent=title;$('#dialog-kicker').textContent=kicker;$('#close-dialog').hidden=false;if(!dialog.open)dialog.showModal();}
 function body(html){$('#dialog-body').innerHTML=html;$('#dialog-body').scrollTop=0;$('#dialog-actions').innerHTML='';answered=false;}
 function action(text,fn){const b=document.createElement('button');b.className='primary';b.textContent=text;b.onclick=fn;$('#dialog-actions').append(b);return b;}
 function npc(text,who=current?.npc||'피움이'){return `<div class="npc-scene" style="background:${current?.color||'#e4eed5'}">${who==='피움이'?'<img src="./protagonist.png" alt="피움이">':'<span class="npc-icon" role="img" aria-label="상담자">🧑‍💼</span>'}<div class="npc-label">${current?.name||'마음마을'}<b>${who}</b></div></div><div class="speech"><p>${text}</p></div>`;}
 function close(){resetInput();dialog.close();current=null;screen='village';updateNearby();if(pendingEnding){pendingEnding=false;ending();}}
 $('#close-dialog').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 function start(){playing=true;screen='village';$('#start').hidden=true;$('#hud').hidden=false;$('#controls').hidden=false;if(completed.size===5){ending();return;}if(completed.size===0){open('마음마을에 온 걸 환영해!','PIUM’S HEART VILLAGE');body(npc('안녕! 나는 피움이야!\n\n내 마음의 꽃잎 5개가 마을 곳곳으로 흩어져 버렸어!\n\n마을에 있는 다섯 장소를 탐험하면서 꽃잎을 함께 찾아줄래?')+'<p class="save-note">왼쪽 조이스틱으로 움직이고, 건물 문 앞에서 [입장]을 눌러요. 컴퓨터에서는 방향키 또는 WASD로 움직일 수 있어요.</p>');action('꽃잎 찾으러 가기',close);}}
 $('#start-button').onclick=start;$('#enter').onclick=()=>enter();
 function enter(){if(!playing||dialog.open)return false;near=nearest();if(!near)return false;current=near;stage=0;screen='quest';open(current.name,completed.has(current.id)?'다시 만나는 마음 퀘스트':'마음의 꽃잎을 찾아서');renderQuest();return true;}
 function flow(list){return '<ol class="flow">'+list.map((s,i)=>`<li><b>${i+1}</b>${s}</li>`).join('')+'</ol>';}
 function next(){stage++;renderQuest();}
 function renderQuest(){const id=current.id;
  if(id==='individual'){
   if(stage===0){body(npc('학생상담센터에서 개인상담을 받고 싶다면 어떻게 하면 될까요?'));action('이용방법 알아보기',next);}
   else if(stage<=4){body(`<div class="step-card"><div class="step-number">STEP ${stage}</div><h3>${INDIVIDUAL[stage-1]}</h3></div><div class="step-track">${INDIVIDUAL.map((_,i)=>`<i class="${i<stage?'active':''}"></i>`).join('')}</div>`);action(stage===4?'전체 과정 확인하기':'다음',next);}
   else{body('<h3>개인상담은 이렇게 시작해요</h3>'+flow(INDIVIDUAL)+npc('생각보다 어렵지 않죠?\n이렇게 신청하면 개인상담을 이용할 수 있어요!'));action('확인 · 꽃잎 받기',complete);}
  }else if(id==='group'){
   if(stage===0){body(npc('학생상담센터에서는 여러 학생이 함께 참여하는 다양한 집단상담 프로그램도 운영하고 있어요!\n\n집단상담 프로그램은 시기에 따라 달라질 수 있어요.\n\n현재 어떤 프로그램을 모집하고 있는지 궁금하다면 어디에서 확인하면 될까요?'));action('신청방법 알아보기',next);}
   else{body('<h3>집단상담 확인 및 신청</h3>'+flow(GROUP)+'<p>상상시스템에서 현재 모집 중인 집단상담 프로그램을 확인하고 신청해요.</p>');action('확인 · 꽃잎 받기',complete);}
  }else if(id==='tests'){
   if(stage<3){const t=TEST_INFO[stage];body(`<div class="quest-progress">심리검사 알아보기 ${stage+1} / 3</div><div class="step-card"><span style="font-size:38px">${t.icon}</span><h3>${t.name}</h3></div><p>${t.desc}</p><div class="speech"><p>${t.example}</p></div><p>와 같은 고민이 있을 때 활용할 수 있습니다.</p>`);action(stage===2?'세 가지 설명을 모두 확인했어요':'다음 검사 알아보기',next);}
   else if(stage===3){body(npc('이제 어떤 고민에 어떤 심리검사가 어울리는지 한번 맞혀볼까요?'));action('퀴즈 시작',next);}
   else if(stage<=6){const q=TEST_QUIZ[stage-4];quiz(q.q,TEST_INFO.map(t=>t.name),q.a,q.explain,`${stage-3} / 3`,false,stage===6?complete:next);}
  }else if(id==='letters'){
   if(stage===0){body(npc('고민우체국에 세 통의 편지가 도착했어!\n\n이런 고민도 상담센터에서 이야기할 수 있는지 O/X로 맞혀봐!'));action('첫 번째 편지 열기',next);}
   else if(stage<=3){const q=LETTERS[stage-1];quiz(q.q,['O','X'],0,q.explain,`편지 ${stage} / 3`,true,stage===3?complete:next);}
  }else if(id==='center'){quiz('동신대학교 학생상담센터는 어디에 있을까요?',['동신행정관 104호','동신행정관 105호','동신행정관 106호'],1,'학생상담센터는\n동신행정관 105호에 있어요!','FINAL QUEST',false,complete);}
 }
 function quiz(question,options,correct,explanation,progress,ox,done){body(`<div class="quest-progress">${progress}</div>${npc(question)}<div class="answer-list ${ox?'ox':''}"></div><div id="feedback" aria-live="polite"></div>`);const list=$('.answer-list');options.forEach((s,i)=>{const b=document.createElement('button');b.className='answer';b.textContent=ox?s:`${['①','②','③'][i]} ${s}`;b.setAttribute('aria-label',ox?(i===0?'O, 상담받을 수 있어요':'X, 상담받을 수 없어요'):s);b.onclick=()=>{if(answered)return;if(i!==correct&&!ox){b.classList.add('wrong');$('#feedback').className='feedback retry';$('#feedback').innerHTML='<p>조금 더 생각해볼까요?</p>';return;}answered=true;list.querySelectorAll('button').forEach((x,j)=>{x.disabled=true;if(j===correct)x.classList.add('correct');});if(i!==correct)b.classList.add('wrong');$('#feedback').className='feedback';$('#feedback').innerHTML=`<p><b>${i===correct?'✨ 정답!':'정답은 O예요.'}</b><br>${explanation}</p>`;action(done===complete?'확인 · 꽃잎 받기':'다음',done);$('#feedback').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};list.append(b);});}
 function complete(){if(!current)return;const already=completed.has(current.id);completed.add(current.id);if(!already){save();hud();}pendingEnding=!already&&completed.size===5;screen='clear';open(current.name,current.id==='center'?'FINAL QUEST CLEAR!':'QUEST CLEAR!');body(`<div class="clear"><span class="flower">🌸</span><small>${current.id==='center'?'FINAL QUEST CLEAR!':'QUEST CLEAR!'}</small><h3>${already?'다시 만나서 반가워요!':pendingEnding?'마지막 마음의 꽃잎을 획득했습니다!':'마음의 꽃잎을 획득했습니다!'}</h3><p class="quest-name">「${current.topic}」</p>${current.id==='letters'?'<p>꼭 심각한 고민이 아니어도 괜찮아요.\n누군가와 이야기해보고 싶은 고민이 있다면 학생상담센터를 이용할 수 있어요.</p>':''}<div class="reward">${already?'이미 찾은 꽃잎이에요. 꽃잎은 한 번만 받을 수 있어요.':`꽃잎 +1 · 마음의 꽃잎 ${completed.size} / 5`}</div></div>`);action('마을로 돌아가기',close);}
 function ending(){screen='ending';current=null;open('마음의 꽃잎을 모두 찾았습니다!','PIUM’S HEART VILLAGE · CLEAR');body('<div class="clear"><div class="ending-image"><img src="./protagonist.png" alt="꽃잎을 되찾은 피움이">'+Array.from({length:5},(_,i)=>`<span class="ending-petal" style="--i:${i}" aria-hidden="true">🌸</span>`).join('')+'</div><h3>피움이의 마음마을 CLEAR!</h3><p>고마워!\n덕분에 마음의 꽃잎을 모두 되찾았어!</p><p>이제 학생상담센터가\n조금 더 친숙해졌으면 좋겠어.</p><p>고민이 생기거나 누군가와 이야기하고 싶은 순간이 오면 언제든 학생상담센터를 기억해줘!</p><div class="address">동신대학교 학생상담센터<b>동신행정관 105호</b></div></div>');action('마을 다시 둘러보기',close);}
 $('#collection').onclick=()=>{screen='journal';open('모은 마음의 꽃잎',`${completed.size} / 5 PETALS`);body('<p>다섯 장소를 원하는 순서로 둘러보세요.</p><ul class="journal">'+VILLAGE.map(b=>`<li><div><b>${b.name}</b><small>${b.topic}</small></div><span>${completed.has(b.id)?'🌸 완료':'아직 못 찾았어요'}</span></li>`).join('')+'</ul>');action('마을로 돌아가기',close);};
 $('#help').onclick=()=>{screen='help';open('마음마을 탐험 안내','HOW TO PLAY');body('<h3>피움이와 꽃잎을 찾아요</h3><p>① 왼쪽 아래 조이스틱을 누른 채 움직여요.\n\n② 건물 문 앞의 작은 원 가까이 가면 오른쪽 [입장] 버튼이 켜져요.\n\n③ 이야기를 읽고 퀘스트를 마치면 꽃잎을 받아요.</p><p>컴퓨터에서는 방향키 또는 WASD로 이동하고 Enter로 입장할 수 있어요.</p><p>모든 건물은 자유로운 순서로 방문할 수 있어요. 퀴즈를 틀려도 괜찮아요!</p><p class="save-note">완료한 퀘스트는 이 브라우저에 저장돼요. 기기나 브라우저를 바꾸거나 브라우저 데이터를 지우면 이어지지 않아요.</p>');action('탐험 계속하기',close);};
 // Optional browser agent interface: read-only progress, same live state as the HUD.
 if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_village_progress',title:'마음마을 진행 상황 읽기',description:'Read collected petals and current nearby building without changing the game.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object');return {petals:completed.size,total:5,completed:[...completed],screen,nearby:near?.name||null};}})).catch(()=>{});}catch{}}
 hud();resize();requestAnimationFrame(frame);
})();
