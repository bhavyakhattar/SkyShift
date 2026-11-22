/* THE DRONE QUEST: game logic. Sections: helpers, data, state, map generation,
   game flow, update, render, radar, HUD, main loop and input. */
'use strict';
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s), cv=$('#c'), ctx=cv.getContext('2d');
const mk=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const cl=(v,a,b)=>Math.min(b,Math.max(a,v)), lerp=(a,b,k)=>a+(b-a)*k, fmt=s=>Math.floor(s/60)+':'+String(Math.max(0,Math.floor(s%60))).padStart(2,'0');
let ac;function beep(f,d=.1,t='sine'){try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(ac.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.stop(ac.currentTime+d)}catch(e){}}
/* ---------- data ---------- */
const WW=2400,WH=1600,LX=[0,1,2,3,4,5].map(i=>i*400+345),LY=[0,1,2,3].map(i=>i*400+345);
const MAPS=[{n:'NEO CITY',a:'#19e6ff',b:'#3d5bff',bg:'#050b24',seed:11},{n:'SKY PORT',a:'#ff3fd0',b:'#9a4dff',bg:'#14041f',seed:29},{n:'CYBER ZONE',a:'#9a6bff',b:'#19e6ff',bg:'#070620',seed:53}];
const DIFF={CADET:{t:1.4,h:5,p:.6},PILOT:{t:1,h:3,p:1},ACE:{t:.8,h:2,p:1.5}};
const ZC=['#19e6ff','#ff3fd0','#9a6bff'],GOLD='#ffd24a',ZL=['A','B','C'];
const WX={clear:{v:0,w:0,t:'CLEAR SKIES'},rain:{v:.3,w:35,t:'HEAVY RAIN'},fog:{v:.72,w:0,t:'DENSE FOG'},storm:{v:.55,w:120,t:'ELECTRIC STORM'}};
const LB0=[['AERO-X',4200],['NOVA',3650],['KITE',3100],['ZEN',2400],['ORBIT',1800]];
/* ---------- state ---------- */
let W,H,dpr,zoom=1,cam={x:0,y:0},S={st:'menu',diff:'PILOT',name:'PILOT',lv:0,score:0,lvStart:0},M,D,K={},tS=0,hudT=0,joy=null;
function rs(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;zoom=Math.max(cl(Math.min(W/1000,H/650),.6,1.3),W/WW,H/WH)}
addEventListener('resize',rs);rs();
/* ---------- map generation ---------- */
function hitB(x,y,r){for(const b of M.b){const cx=cl(x,b.x,b.x+b.w),cy=cl(y,b.y,b.y+b.h);if((x-cx)**2+(y-cy)**2<r*r)return b}return 0}
function build(lv){
  const mp=MAPS[lv],R=mk(mp.seed+lv*7+((Math.random()*999)|0)),df=DIFF[S.diff];
  M={mp,lv,b:[],cargo:[],zones:[],rz:[],pat:[],cars:[],bc:[],par:[],pop:[],t:0,combo:0,hull:df.h,hullMax:df.h,carry:-1,tb:1,inv:0,shake:0,rt:0,
     st:{del:0,hits:0,pen:0,best:0,fast:99,t0:0},W:{k:'clear',t:0,nx:18,vis:0,flash:0,dir:1},rain:[]};
  for(let c=0;c<6;c++)for(let r=0;r<4;r++){const x=c*400,y=r*400,q=R();
    if(q<.12)continue;
    if(q<.5)M.b.push({x:x+8,y:y+8,w:274,h:274,h3:R()});
    else for(let i=0;i<2;i++)for(let j=0;j<2;j++)if(R()<.85)M.b.push({x:x+8+i*140,y:y+8+j*140,w:126,h:126,h3:R()})}
  const n=3+lv,pt=(av)=>{for(let k=0;k<400;k++){let x,y;if(R()<.5){x=LX[(R()*6)|0];y=80+R()*(WH-160)}else{y=LY[(R()*4)|0];x=80+R()*(WW-160)}
    if(M.cargo.concat(M.zones).every(o=>Math.hypot(o.x-x,o.y-y)>230)&&M.rz.every(o=>Math.hypot(o.x-x,o.y-y)>o.r+70)&&Math.hypot(x-345,y-345)>260)return{x,y}}return{x:LX[(R()*6)|0],y:LY[(R()*4)|0]}};
  const used=new Set();while(M.rz.length<2+lv){const a=1+((R()*5)|0),b=((R()*4)|0),k=a+','+b;if(a===0&&b===0||used.has(k))continue;used.add(k);M.rz.push({x:LX[a],y:LY[b],r:78})}
  for(let i=0;i<3;i++){const p=pt();M.zones.push({x:p.x,y:p.y,r:72,c:ZC[i],l:ZL[i]})}
  for(let i=0;i<n;i++){const p=pt(),sp=i===n-1&&lv>0||i===1&&lv===2;M.cargo.push({x:p.x,y:p.y,z:(R()*3)|0,sp,s:0,ph:R()*6})}
  for(let i=0;i<Math.round((2+lv*2)*df.p);i++){const h=R()<.5,c=h?LY[(R()*4)|0]:LX[(R()*6)|0],a=80+R()*600;M.pat.push({h,c,p:a+R()*300,a,b:a+500+R()*600,v:(90+lv*30+R()*50)*(R()<.5?1:-1)})}
  for(let i=0;i<40;i++){const h=R()<.5;M.cars.push({h,c:h?LY[(R()*4)|0]+(R()<.5?-14:14):LX[(R()*6)|0]+(R()<.5?-14:14),p:R()*2400,v:(60+R()*90)*(R()<.5?-1:1),k:R()<.5?mp.a:'#ff3fd0'})}
  for(let i=0;i<70;i++){const b=M.b[(R()*M.b.length)|0];if(b)M.bc.push({x:b.x+R()*b.w,y:b.y+R()*b.h,f:R()*6,c:R()<.5?'#ff3f6a':'#fff'})}
  M.time=Math.round((55+n*26)*df.t);M.pre=M.time;
  M.sc=paint(mp,R);
  D={x:345,y:345,vx:0,vy:0,a:0,rot:0};
  M.cam={x:0,y:0};
}
function paint(mp,R){
  const o=document.createElement('canvas');o.width=WW;o.height=WH;const g=o.getContext('2d');
  g.fillStyle=mp.bg;g.fillRect(0,0,WW,WH);
  g.strokeStyle='rgba(120,150,255,.06)';g.lineWidth=1;for(let x=0;x<WW;x+=50){g.beginPath();g.moveTo(x,0);g.lineTo(x,WH);g.stroke()}for(let y=0;y<WH;y+=50){g.beginPath();g.moveTo(0,y);g.lineTo(WW,y);g.stroke()}
  g.fillStyle='#0b0f2e';for(const x of LX)g.fillRect(x-55,0,110,WH);for(const y of LY)g.fillRect(0,y-55,WW,110);
  g.setLineDash([22,18]);g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=2;
  for(const x of LX){g.beginPath();g.moveTo(x,0);g.lineTo(x,WH);g.stroke()}for(const y of LY){g.beginPath();g.moveTo(0,y);g.lineTo(WW,y);g.stroke()}g.setLineDash([]);
  g.lineWidth=2;g.shadowBlur=14;
  for(const b of M.b){const c=b.h3<.5?mp.a:mp.b;g.shadowColor=c;g.strokeStyle=c;g.fillStyle='rgba(8,11,36,.96)';g.fillRect(b.x,b.y,b.w,b.h);g.strokeRect(b.x,b.y,b.w,b.h);
    g.shadowBlur=0;g.strokeStyle='rgba(255,255,255,.06)';g.strokeRect(b.x+9,b.y+9,b.w-18,b.h-18);
    for(let i=0;i<b.w*b.h/420;i++){g.fillStyle=R()<.5?c:'#fff';g.globalAlpha=.15+R()*.5;g.fillRect(b.x+12+R()*(b.w-24),b.y+12+R()*(b.h-24),3,3)}g.globalAlpha=1;g.shadowBlur=14}
  const tb=M.b.filter(b=>b.w>200).sort((a,b)=>Math.hypot(a.x-200,a.y-200)-Math.hypot(b.x-200,b.y-200))[0]||M.b[0];
  if(tb){g.shadowColor='#ff3fd0';g.shadowBlur=16;g.textAlign='center';g.fillStyle='#ff3fd0';g.font='800 40px Orbitron,sans-serif';g.fillText('ti',tb.x+tb.w*.22,tb.y+84);g.fillStyle='#fff';g.font='800 24px Orbitron,sans-serif';g.fillText('THAPAR',tb.x+tb.w*.64,tb.y+76);g.font='800 15px Orbitron,sans-serif';g.fillText('UNIVERSITY',tb.x+tb.w*.64,tb.y+98)}
  return o;
}
/* ---------- game flow ---------- */
function start(lv,keep){if(!keep)S.score=0;S.lv=lv;S.lvStart=S.score;build(lv);S.st='play';$('#hud').hidden=false;$('#scr').hidden=true;M.st.t0=0;note('MISSION '+(lv+1)+': '+M.mp.n,'#19e6ff');list();beep(520,.2)}
function note(t,c){const n=$('#note');n.textContent=t;n.style.color=c||'#fff';n.classList.remove('s');void n.offsetWidth;n.classList.add('s')}
function fx(x,y,c,n,sp=140){for(let i=0;i<n;i++){const a=Math.random()*6.283,s=sp*(.3+Math.random());M.par.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c})}}
function pop(x,y,t,c){M.pop.push({x,y,t,c,l:1})}
function hurt(){if(M.inv>0)return;M.hull--;M.inv=1;M.shake=14;M.combo=0;M.st.hits++;fx(D.x,D.y,'#ff3f6a',22,200);beep(110,.25,'sawtooth');note('IMPACT!','#ff3f6a');if(M.hull<=0)end(false)}
function act(){if(S.st!=='play')return;
  if(M.carry<0){let bi=-1,bd=60;M.cargo.forEach((c,i)=>{const d=Math.hypot(c.x-D.x,c.y-D.y);if(!c.s&&d<bd){bd=d;bi=i}});
    if(bi<0)return note('MOVE CLOSER TO CARGO','#8fa6cf');M.carry=bi;M.cargo[bi].s=1;M.cargo[bi].t=M.t;fx(D.x,D.y,'#19e6ff',26);beep(700,.15);note((M.cargo[bi].sp?'★ VIP CARGO · ':'CARGO SECURED · ')+'DELIVER TO ZONE '+ZL[M.cargo[bi].z],M.cargo[bi].sp?GOLD:'#19e6ff');list()}
  else{const c=M.cargo[M.carry],z=M.zones[c.z];if(Math.hypot(z.x-D.x,z.y-D.y)>z.r)return note('WRONG LOCATION: GO TO ZONE '+z.l,'#ff3f6a');
    const el=M.t-c.t;M.combo++;M.st.best=Math.max(M.st.best,M.combo);M.st.fast=Math.min(M.st.fast,el);M.st.del++;
    const bonus=Math.max(0,Math.round(100-el*3))*(c.sp?2:1),mult=Math.min(2.5,1+.25*(M.combo-1)),pts=Math.round(((c.sp?300:100)+bonus)*mult);
    S.score+=pts;c.s=2;M.carry=-1;fx(z.x,z.y,z.c,50,220);fx(z.x,z.y,'#fff',16,120);M.rt=1;pop(z.x,z.y-30,'+'+pts,c.sp?GOLD:'#fff');beep(880,.2);setTimeout(()=>beep(1180,.25),120);
    note('DELIVERED +'+pts+(M.combo>1?'  ·  COMBO x'+mult.toFixed(2):''),z.c);list();
    if(M.cargo.every(c=>c.s===2))end(true)}}
function end(win){if(S.st!=='play')return;S.st='end';const st=M.st,left=win?Math.round(M.time):0;if(win){S.score+=left*10;try{localStorage.dqu=Math.max(+localStorage.dqu||0,S.lv+1)}catch(e){}}
  const last=S.lv>=2,rank=!win?'F':M.hull===M.hullMax&&left>M.pre*.3?'S':M.hull>=M.hullMax-1&&left>M.pre*.15?'A':left>0?'B':'C';
  if(!win||last)save();
  const g=(v,l)=>`<div><b>${v}</b><span>${l}</span></div>`;
  const best=Math.max(S.score,...lb().filter(e=>!e.r).map(e=>e.s));
  sc(`<div class="dlg ${win?'vic':'ovr'}">${win?'<div style="font-size:40px">🏆</div>':''}<h1 class="dh">${win?(last?'CITY SAVED':'VICTORY'):'GAME OVER'}</h1><div class="sb">${win?'Mission Completed!':(M.hull<=0?'Drone destroyed':'Time expired')}</div><div class="ln">Score: <b>${S.score}</b></div><div class="ln">${win?'Time: <b>'+fmt(M.pre-M.time)+'</b> &nbsp; Combo: <b>x'+st.best+'</b>':'Best: <b>'+best+'</b>'}</div></div>
  <div class="grid">${g(S.score,'SCORE')}${g(rank,'RANK')}${g(st.del+'/'+M.cargo.length,'DELIVERED')}${g('x'+st.best,'BEST COMBO')}${g(st.fast<99?st.fast.toFixed(1)+'s':'—','FASTEST')}${g(st.hits,'COLLISIONS')}${g(st.pen,'ZONE BREACHES')}${g(fmt(M.pre-M.time),'FLIGHT TIME')}${g(left+'s','TIME LEFT')}</div>
  ${win&&last||!win?'<div class="card"><h3 style="margin:0 0 6px;font-size:10px;letter-spacing:.25em;color:var(--dim)">LEADERBOARD</h3>'+lbHTML()+'</div>':''}
  <div class="row">${win&&!last?'<button class="go" id="bN">Next mission</button>':''}<button id="bT" class="${win&&!last?'':'go'}">${win&&last?'Play again':'Retry mission'}</button><button id="bM">Main menu</button></div>`);
  $('#bN')&&($('#bN').onclick=()=>start(S.lv+1,1));
  $('#bT').onclick=()=>win&&last?start(0):(S.score=S.lvStart,start(S.lv,1));$('#bM').onclick=menu;
  note(win?'MISSION COMPLETE':'MISSION FAILED',win?'#3dff9a':'#ff3f6a');beep(win?1000:150,.5,win?'sine':'sawtooth')}
function sc(h){$('#sc0').innerHTML=h;$('#scr').hidden=false}
function lb(){let a=[];try{a=JSON.parse(localStorage.dq||'[]')}catch(e){}return a.concat(LB0.map(([n,s])=>({n,s,r:1}))).sort((a,b)=>b.s-a.s).slice(0,7)}
function save(){let a=[];try{a=JSON.parse(localStorage.dq||'[]');a.push({n:S.name,s:S.score,d:S.diff});localStorage.dq=JSON.stringify(a.slice(-30))}catch(e){}}
function lbHTML(){return '<table>'+lb().map((e,i)=>`<tr class="${e.r?'':'me'}"><td><i class="rk">${i+1}</i>${e.n.replace(/[<>&]/g,'')}</td><td>${e.s}</td></tr>`).join('')+'</table>'}
function menu(){S.st='menu';let un=0;try{un=+localStorage.dqu||0}catch(e){}$('#hud').hidden=true;if(!M||M.lv!==0)build(0);
  sc(`<div class="ttl"><small>THE</small><h1>DRONE QUEST</h1><svg viewBox="0 0 60 40" fill="none" stroke-width="2.5"><circle cx="12" cy="10" r="8" stroke="#19e6ff"/><circle cx="48" cy="10" r="8" stroke="#ff3fd0"/><circle cx="12" cy="32" r="6" stroke="#ff3fd0"/><circle cx="48" cy="32" r="6" stroke="#19e6ff"/><rect x="22" y="14" width="16" height="12" rx="5" fill="#dfe6ff" stroke="#fff"/></svg></div><div class="sub">PICK • CARRY • DROP</div>
  <div class="row"><input id="nm" maxlength="10" value="${S.name}" aria-label="Pilot name"></div>
  <div class="row" id="df">${Object.keys(DIFF).map(d=>`<button data-d="${d}" class="${d===S.diff?'on':''}">${d}</button>`).join('')}</div>
  <div class="two"><div class="card"><h4>▤ MISSION BRIEF</h4>Collect the cargo packages and deliver them to the target zones. Avoid obstacles! Gold ★ cargo pays more, and the weather changes visibility.</div><div class="card"><h4>CONTROLS</h4><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move<br><kbd>E</kbd> / <kbd>SPACE</kbd> Pick / Drop<br><kbd>SHIFT</kbd> Turbo<br><kbd>P</kbd> Pause</div></div>
  <div class="card"><h4>LEVEL SELECT</h4><div class="lv">${MAPS.map((m,i)=>`<div class="lc ${i>un?'lk':''}" data-l="${i}" style="--a:${m.a};--b:${m.b}"><div class="th"></div><b>${m.n}</b><small>(${['Easy','Medium','Hard'][i]})</small>${i<un?'<em>✅</em>':i>un?'<em>🔒</em>':''}</div>`).join('')}</div></div>
  <div class="row"><button class="go" id="bS">Start mission</button></div>
  <div class="card"><h4>♛ LEADERBOARD</h4>${lbHTML()}</div>`);
  $('#df').onclick=e=>{const d=e.target.dataset.d;if(d){S.diff=d;document.querySelectorAll('#df button').forEach(b=>b.classList.toggle('on',b.dataset.d===d))}};
  $('#bS').onclick=()=>{S.name=($('#nm').value||'PILOT').toUpperCase();S.score=0;start(0)};document.querySelectorAll('.lc').forEach(e=>e.onclick=()=>{const l=+e.dataset.l;if(l>un)return beep(150,.15,'square');S.name=($('#nm').value||'PILOT').toUpperCase();S.score=0;start(l)})}
function pause(){if(S.st==='play'){S.st='pause';$('#bP').textContent='Resume';sc('<h1 style="font-size:clamp(30px,6vw,56px)">PAUSED</h1><div class="row"><button class="go" id="bC">Resume</button><button id="bQ">Main menu</button></div>');$('#bC').onclick=pause;$('#bQ').onclick=menu}
  else if(S.st==='pause'){S.st='play';$('#bP').textContent='Pause';$('#scr').hidden=true}}
function list(){const ol=$('#ol');ol.innerHTML=M.cargo.map((c,i)=>`<li style="opacity:${c.s===2?.45:1}"><i style="background:${ZC[c.z]}"></i>${c.sp?'★ VIP':'CARGO'} → ZONE ${ZL[c.z]} ${c.s===2?'✔':c.s===1?'▶':''}</li>`).join('');
  $('#lvl').textContent='MISSION '+(M.lv+1)+'/3 · '+S.diff;$('#mn').textContent=M.mp.n}
/* ---------- update ---------- */
function update(dt){
  const m=M,w=m.W;m.t+=dt;m.time-=dt;m.inv-=dt;m.rt-=dt;m.shake*=.9;
  if(m.time<=0)return end(false);
  w.nx-=dt;if(w.nx<=0){const ks=['clear','rain','fog','storm'].slice(0,2+m.lv).filter(k=>k!==w.k);w.k=ks[(Math.random()*ks.length)|0];w.nx=22+Math.random()*14;w.dir=Math.random()<.5?-1:1;note(WX[w.k].t,'#9a6bff')}
  w.vis=lerp(w.vis,WX[w.k].v,dt*.6);w.flash*=.88;if(w.k==='storm'&&Math.random()<dt*.5)w.flash=1;
  let ix=(K.ArrowRight||K.d?1:0)-(K.ArrowLeft||K.a?1:0),iy=(K.ArrowDown||K.s?1:0)-(K.ArrowUp||K.w?1:0);
  if(joy){ix=cl(joy.x/50,-1,1);iy=cl(joy.y/50,-1,1)}
  const l=Math.hypot(ix,iy);if(l>1){ix/=l;iy/=l}
  const tbo=(K.Shift&&m.tb>.02&&l>0)?1:0;m.tb=cl(m.tb+(tbo?-.35:.12)*dt,0,1);const acc=950*(1+tbo*.8),mxs=430*(1+tbo*.5);D.vx+=(ix*acc+WX[w.k].w*w.dir)*dt;D.vy+=iy*acc*dt;const dr=Math.exp(-2.4*dt);D.vx*=dr;D.vy*=dr;
  const sp=Math.hypot(D.vx,D.vy);if(sp>mxs){D.vx*=mxs/sp;D.vy*=mxs/sp}
  let nx=D.x+D.vx*dt;if(hitB(nx,D.y,13)){D.vx*=-.5;hurt()}else D.x=nx;
  let ny=D.y+D.vy*dt;if(hitB(D.x,ny,13)){D.vy*=-.5;hurt()}else D.y=ny;
  if(D.x<14||D.x>WW-14){D.x=cl(D.x,14,WW-14);D.vx*=-.4}if(D.y<14||D.y>WH-14){D.y=cl(D.y,14,WH-14);D.vy*=-.4}
  if(sp>30)D.a=Math.atan2(D.vy,D.vx);D.rot+=dt*40;
  for(const p of m.pat){p.p+=p.v*dt;if(p.p<p.a||p.p>p.b)p.v*=-1;const px=p.h?p.p:p.c,py=p.h?p.c:p.p;p.x=px;p.y=py;
    if(Math.hypot(px-D.x,py-D.y)<30){hurt();const a=Math.atan2(D.y-py,D.x-px);D.vx=Math.cos(a)*320;D.vy=Math.sin(a)*320}}
  let inR=false;for(const z of m.rz)if(Math.hypot(z.x-D.x,z.y-D.y)<z.r)inR=true;
  if(inR){m.rzT=(m.rzT||0)-dt;if(!m.in){m.in=1;m.combo=0;note('RESTRICTED AIRSPACE: TIME DRAINING','#ff3f6a');beep(200,.3,'square')}if(m.rzT<=0){m.rzT=.5;m.time-=1;m.st.pen+=0.5}}else m.in=0;
  for(const c of m.cars){c.p+=c.v*dt;if(c.p<-40)c.p=(c.h?WW:WH)+40;if(c.p>(c.h?WW:WH)+40)c.p=-40}
  for(const p of m.par){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.l-=dt*1.3}m.par=m.par.filter(p=>p.l>0);
  for(const p of m.pop){p.y-=30*dt;p.l-=dt*.8}m.pop=m.pop.filter(p=>p.l>0);
  if(sp>150&&Math.random()<.5)m.par.push({x:D.x-Math.cos(D.a)*10,y:D.y-Math.sin(D.a)*10,vx:0,vy:0,l:.5,c:m.mp.a});
  if(m.carry>=0&&Math.random()<.3)m.par.push({x:D.x,y:D.y,vx:(Math.random()-.5)*30,vy:(Math.random()-.5)*30,l:.6,c:m.cargo[m.carry].sp?GOLD:'#fff'});
  if(w.k==='rain'||w.k==='storm'){while(m.rain.length<140)m.rain.push({x:Math.random(),y:Math.random(),s:.8+Math.random()});for(const r of m.rain){r.y+=dt*1.6*r.s;r.x+=dt*.3*w.dir*(w.k==='storm'?2:1);if(r.y>1){r.y=0;r.x=Math.random()}if(r.x>1)r.x=0;if(r.x<0)r.x=1}}
}
/* ---------- render ---------- */
function draw(t){
  const m=M,vw=W/zoom,vh=H/zoom;let cx,cy;
  if(S.st==='menu'){cx=(WW-vw)*(.5+.5*Math.sin(t*.05));cy=(WH-vh)*(.5+.5*Math.cos(t*.037))}else{cx=cl(D.x-vw/2,0,WW-vw);cy=cl(D.y-vh/2,0,WH-vh)}
  m.cam.x=lerp(m.cam.x,cx,.12);m.cam.y=lerp(m.cam.y,cy,.12);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#03040f';ctx.fillRect(0,0,W,H);
  const sh=m.shake,ox=sh>.5?(Math.random()-.5)*sh:0,oy=sh>.5?(Math.random()-.5)*sh:0;
  ctx.save();ctx.translate(ox,oy);ctx.drawImage(m.sc,m.cam.x,m.cam.y,vw,vh,0,0,W,H);
  ctx.scale(zoom,zoom);ctx.translate(-m.cam.x,-m.cam.y);
  ctx.globalCompositeOperation='lighter';
  for(const c of m.cars){const x=c.h?c.p:c.c,y=c.h?c.c:c.p;ctx.fillStyle=c.k;ctx.globalAlpha=.8;ctx.fillRect(x-6,y-3,c.h?12:6,c.h?6:12);ctx.globalAlpha=.15;ctx.fillRect(x-(c.h?Math.sign(c.v)*22:6),y-(c.h?3:Math.sign(c.v)*22),c.h?22:6,c.h?6:22)}
  for(const b of m.bc){ctx.globalAlpha=.35+.65*Math.max(0,Math.sin(t*2.5+b.f));ctx.fillStyle=b.c;ctx.fillRect(b.x-2,b.y-2,4,4)}ctx.globalAlpha=1;
  const ps=1+.05*Math.sin(t*4);
  for(const z of m.zones){const tgt=m.carry>=0&&m.cargo[m.carry].z===m.zones.indexOf(z);ctx.save();ctx.translate(z.x,z.y);ctx.shadowColor=z.c;ctx.shadowBlur=tgt?30:14;ctx.strokeStyle=z.c;ctx.lineWidth=tgt?4:2;ctx.fillStyle=z.c;ctx.globalAlpha=tgt?.2+.12*Math.sin(t*6):.08;ctx.beginPath();ctx.arc(0,0,z.r*ps,0,6.283);ctx.fill();ctx.globalAlpha=1;ctx.setLineDash([14,10]);ctx.rotate(t*.5);ctx.beginPath();ctx.arc(0,0,z.r,0,6.283);ctx.stroke();ctx.rotate(-t*.5);ctx.setLineDash([]);ctx.font='800 34px Orbitron,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(z.l,0,2);ctx.restore()}
  for(const z of m.rz){ctx.save();ctx.translate(z.x,z.y);ctx.shadowColor='#ff3f6a';ctx.shadowBlur=18;ctx.strokeStyle='#ff3f6a';ctx.lineWidth=3;ctx.fillStyle='#ff3f6a';ctx.globalAlpha=.14+.1*Math.sin(t*5);ctx.beginPath();ctx.arc(0,0,z.r,0,6.283);ctx.fill();ctx.globalAlpha=.9;ctx.stroke();ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(-z.r*.7,-z.r*.7);ctx.lineTo(z.r*.7,z.r*.7);ctx.moveTo(z.r*.7,-z.r*.7);ctx.lineTo(-z.r*.7,z.r*.7);ctx.stroke();ctx.restore()}
  ctx.globalCompositeOperation='source-over';
  m.cargo.forEach((c,i)=>{if(c.s)return;const col=c.sp?GOLD:ZC[c.z];ctx.save();ctx.translate(c.x,c.y);ctx.shadowColor=col;ctx.shadowBlur=18;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(0,0,20+Math.sin(t*3+c.ph)*2,0,6.283);ctx.stroke();ctx.globalAlpha=.4;ctx.beginPath();ctx.arc(0,0,30,0,6.283);ctx.stroke();ctx.globalAlpha=1;ctx.translate(0,Math.sin(t*3+c.ph)*3-4);ctx.shadowBlur=22;ctx.strokeStyle=col;ctx.fillStyle='rgba(10,14,45,.9)';ctx.lineWidth=2.5;ctx.rotate(c.sp?t:0);ctx.fillRect(-11,-11,22,22);ctx.strokeRect(-11,-11,22,22);ctx.rotate(c.sp?-t:0);ctx.fillStyle=col;ctx.font='800 11px Orbitron,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.sp?'★':ZL[c.z],0,1);
    if(S.st==='play'&&Math.hypot(c.x-D.x,c.y-D.y)<60){ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(0,0,60,0,6.283);ctx.stroke();ctx.fillText('E / SPACE',0,-28)}ctx.restore()});
  for(const p of m.pat){ctx.save();ctx.translate(p.x,p.y);ctx.shadowColor='#ff3f6a';ctx.shadowBlur=18;ctx.fillStyle='rgba(255,63,106,.12)';ctx.beginPath();ctx.arc(0,0,42,0,6.283);ctx.fill();ctx.strokeStyle='#ff3fd0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,13,0,6.283);ctx.stroke();ctx.fillStyle='#ff3f6a';ctx.beginPath();ctx.arc(0,0,5+Math.sin(t*8),0,6.283);ctx.fill();for(let i=0;i<4;i++){const a=t*20+i*1.57;ctx.beginPath();ctx.moveTo(Math.cos(a)*10,Math.sin(a)*10);ctx.lineTo(Math.cos(a)*19,Math.sin(a)*19);ctx.stroke()}ctx.restore()}
  if(S.st!=='menu'){
    ctx.save();ctx.translate(D.x,D.y);ctx.globalAlpha=.3;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(6,10,13,8,0,0,6.283);ctx.fill();ctx.globalAlpha=m.inv>0&&Math.floor(t*14)%2?.35:1;
    if(m.carry>=0){const c=m.cargo[m.carry];ctx.fillStyle=c.sp?GOLD:ZC[c.z];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=14;ctx.fillRect(-6-D.vx*.02,5-D.vy*.02,12,12)}
    ctx.rotate(D.a);ctx.shadowColor=m.mp.a;ctx.shadowBlur=20;ctx.strokeStyle=m.mp.a;ctx.lineWidth=3;ctx.fillStyle='#0a0e30';
    for(const[a,b]of[[-11,-11],[11,-11],[-11,11],[11,11]]){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(a,b);ctx.stroke();ctx.save();ctx.translate(a,b);ctx.strokeStyle=a>0?'#ff3fd0':m.mp.a;ctx.shadowColor=ctx.strokeStyle;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,9,0,6.283);ctx.stroke();ctx.rotate(m.t*40);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.stroke();ctx.restore()}
    ctx.lineWidth=3;ctx.strokeStyle=m.mp.a;ctx.fillStyle='#dfe6ff';ctx.beginPath();ctx.ellipse(0,0,11,7,0,0,6.283);ctx.fill();ctx.stroke();ctx.fillStyle='#19e6ff';ctx.beginPath();ctx.arc(7,0,2.8,0,6.283);ctx.fill();ctx.restore()}
  ctx.globalCompositeOperation='lighter';for(const p of m.par){ctx.globalAlpha=Math.max(0,p.l);ctx.fillStyle=p.c;ctx.fillRect(p.x-2,p.y-2,4,4)}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  if(m.rt>0){ctx.strokeStyle='#fff';ctx.globalAlpha=m.rt;ctx.lineWidth=3;ctx.beginPath();ctx.arc(D.x,D.y,(1-m.rt)*160,0,6.283);ctx.stroke();ctx.globalAlpha=1}
  ctx.font='800 20px Orbitron,sans-serif';ctx.textAlign='center';for(const p of m.pop){ctx.globalAlpha=Math.min(1,p.l*2);ctx.fillStyle=p.c;ctx.shadowColor=p.c;ctx.shadowBlur=12;ctx.fillText(p.t,p.x,p.y)}ctx.shadowBlur=0;ctx.globalAlpha=1;
  ctx.restore();
  /* weather / visibility */
  const w=m.W,vis=w.vis;
  if(vis>.02&&S.st!=='menu'){const px=(D.x-m.cam.x)*zoom,py=(D.y-m.cam.y)*zoom,R0=lerp(1000,240,vis)*zoom,g=ctx.createRadialGradient(px,py,R0*.25,px,py,R0);g.addColorStop(0,'rgba(5,6,24,0)');g.addColorStop(1,`rgba(${w.k==='fog'?'60,70,110':'3,4,16'},${Math.min(.94,vis*1.25)})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  if((w.k==='rain'||w.k==='storm')&&S.st!=='menu'){ctx.strokeStyle='rgba(150,200,255,.35)';ctx.lineWidth=1;ctx.beginPath();for(const r of m.rain){const x=r.x*W,y=r.y*H;ctx.moveTo(x,y);ctx.lineTo(x+w.dir*5,y+14*r.s)}ctx.stroke()}
  if(w.flash>.05){ctx.fillStyle=`rgba(190,200,255,${w.flash*.45})`;ctx.fillRect(0,0,W,H)}
  if(m.in){ctx.fillStyle=`rgba(255,40,80,${.08+.06*Math.sin(t*12)})`;ctx.fillRect(0,0,W,H)}
  /* objective arrow */
  if(S.st==='play'){let tg=null,col='#fff';if(m.carry>=0){tg=m.zones[m.cargo[m.carry].z];col=tg.c}else{let bd=1e9;m.cargo.forEach(c=>{if(!c.s){const d=Math.hypot(c.x-D.x,c.y-D.y);if(d<bd){bd=d;tg=c;col=c.sp?GOLD:ZC[c.z]}}})}
    if(tg&&Math.hypot(tg.x-D.x,tg.y-D.y)>90){const a=Math.atan2(tg.y-D.y,tg.x-D.x),px=(D.x-m.cam.x)*zoom,py=(D.y-m.cam.y)*zoom;ctx.save();ctx.translate(px+Math.cos(a)*58,py+Math.sin(a)*58);ctx.rotate(a);ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-6,7);ctx.lineTo(-6,-7);ctx.fill();ctx.restore()}}
}
/* ---------- radar ---------- */
const rc=$('#rad').getContext('2d');
function radar(){const g=rc,R0=70,sc=R0/900;g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,150,150);g.translate(75,75);
g.fillStyle='rgba(6,10,40,.8)';g.beginPath();g.arc(0,0,R0,0,6.283);g.fill();g.strokeStyle='rgba(60,140,255,.7)';g.lineWidth=1.5;g.stroke();
g.strokeStyle='rgba(60,140,255,.25)';g.beginPath();g.arc(0,0,R0/2,0,6.283);g.moveTo(-R0,0);g.lineTo(R0,0);g.moveTo(0,-R0);g.lineTo(0,R0);g.stroke();
const dot=(x,y,c,r,f)=>{let dx=(x-D.x)*sc,dy=(y-D.y)*sc;const d=Math.hypot(dx,dy);if(d>R0-4){dx*=(R0-4)/d;dy*=(R0-4)/d}g.fillStyle=g.strokeStyle=c;g.beginPath();g.arc(dx,dy,r,0,6.283);f?g.fill():g.stroke()};
M.zones.forEach(z=>dot(z.x,z.y,z.c,5,0));M.rz.forEach(z=>dot(z.x,z.y,'#ff3f6a',5,1));M.pat.forEach(p=>dot(p.x,p.y,'#ff3fd0',3,1));M.cargo.forEach(c=>!c.s&&dot(c.x,c.y,c.sp?GOLD:'#19e6ff',3.5,1));
g.fillStyle='#fff';g.font='700 10px sans-serif';g.fillText('N',-3,-R0+11);g.rotate(D.a+1.5708);g.beginPath();g.moveTo(0,-7);g.lineTo(5,6);g.lineTo(-5,6);g.fill()}
/* ---------- HUD ---------- */
function hud(){const m=M;$('#sc').textContent=S.score;const tm=$('#tm');tm.textContent=fmt(m.time);tm.style.color=m.time<20?'#ff3f6a':'';
  $('#cb').textContent='x'+Math.min(2.5,1+.25*Math.max(0,m.combo-1)).toFixed(2);$('#hull b').style.width=(m.hull/m.hullMax*100)+'%';
  const d=m.cargo.filter(c=>c.s===2).length;$('#pg').textContent=d+'/'+m.cargo.length;$('#pgb b').style.width=(d/m.cargo.length*100)+'%';
  const c=m.carry>=0?m.cargo[m.carry]:null;$('#cg').textContent=c?(c.sp?'★ VIP':'CARRYING')+' → ZONE '+ZL[c.z]:'NO CARGO';$('#cg').style.color=c?'var(--cy)':'';
  $('#obj').textContent=c?'▶ DROP AT ZONE '+ZL[c.z]:'▶ FIND NEXT CARGO';$('#hint').textContent=c?'DELIVER IT TO THE MARKED ZONE '+ZL[c.z]:'PICK THE CARGO AND DELIVER IT TO THE MARKED ZONE';$('#tb b').style.width=m.tb*100+'%';$('#wx').textContent='◈ '+WX[m.W.k].t+' · VIS '+Math.round((1-m.W.vis)*100)+'%'}
/* ---------- loop & input ---------- */
let last=performance.now();
function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1000);last=n;if(document.hidden)return;tS=n/1000;
  if(S.st==='play'){update(dt);hudT-=dt;if(hudT<=0){hudT=.1;hud()}}
  else if(S.st==='menu'){M.t+=dt;for(const p of M.pat){p.p+=p.v*dt;if(p.p<p.a||p.p>p.b)p.v*=-1;p.x=p.h?p.p:p.c;p.y=p.h?p.c:p.p}for(const c of M.cars){c.p+=c.v*dt;if(c.p<-40)c.p=(c.h?WW:WH)+40;if(c.p>(c.h?WW:WH)+40)c.p=-40}}
  draw(tS);if(S.st==='play')radar()}
addEventListener('keydown',e=>{const k=e.key.length>1?e.key:e.key.toLowerCase();if(S.st==='play'||S.st==='pause'){if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(k))e.preventDefault()}
  if((k===' '||k==='e')&&!e.repeat&&S.st==='play')act();if((k==='p'||k==='Escape')&&!e.repeat)pause();if(k==='r'&&(S.st==='play'||S.st==='pause'))restart();K[k]=1});
addEventListener('keyup',e=>{K[e.key.length>1?e.key:e.key.toLowerCase()]=0});addEventListener('blur',()=>{K={};if(S.st==='play')pause()});
function restart(){S.score=S.lvStart;$('#bP').textContent='Pause';start(S.lv,1)}
$('#bP').onclick=pause;$('#bR').onclick=restart;$('#act').onclick=act;
let jo=null;cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){jo={x:e.clientX,y:e.clientY};joy={x:0,y:0}}});
cv.addEventListener('pointermove',e=>{if(jo)joy={x:e.clientX-jo.x,y:e.clientY-jo.y}});
const rel=()=>{jo=null;joy=null};cv.addEventListener('pointerup',rel);cv.addEventListener('pointercancel',rel);
build(0);menu();requestAnimationFrame(loop);
