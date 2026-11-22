const express=require('express');
const http=require('http');
const path=require('path');
const fs=require('fs');
const {randomInt}=require('crypto');
const {Server}=require('socket.io');
const starter=require('./data');
const fsData=require('fs');
let rms=null;try{rms=JSON.parse(fsData.readFileSync(require('path').join(__dirname,'rms-data.json'),'utf8'))}catch{}
const monsters=rms?.monsters?.length>=100?rms.monsters:starter.monsters;
const items=rms?.items?.length>=100?rms.items:starter.items;
console.log('Quiz data:',rms&&monsters!==starter.monsters?'RateMyServer import':'starter fallback',monsters.length,items.length);
const app=express(),server=http.createServer(app),io=new Server(server);
app.get('/health',(req,res)=>res.json({ok:true,rooms:rooms.size}));
const publicDir=path.join(__dirname,'public');
app.use(express.static(publicDir));
const rooms=new Map();
// Unbiased server-side Fisher-Yates shuffle (new random order each game).
const shuffle=a=>{const out=[...a];for(let i=out.length-1;i>0;i--){const j=randomInt(i+1);[out[i],out[j]]=[out[j],out[i]]}return out};
const uniqueQuestions=a=>[...new Map(a.map(x=>[x.kind+':'+x.id,x])).values()];
const clean=(s,max=30)=>String(s||'').trim().slice(0,max);
function dist(a,b){a=a.toLowerCase().trim().replace(/\s+/g,' ');b=b.toLowerCase().trim().replace(/\s+/g,' ');let p=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let n=[i];for(let j=1;j<=b.length;j++)n[j]=Math.min(n[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=n}return p[b.length]}
function accuracy(a,b){if(!a.trim())return 0;return Math.max(0,1-dist(a,b)/Math.max(a.trim().length,b.length))}
function emitRoom(r){io.to(r.code).emit('room',{code:r.code,host:r.host,phase:r.phase,settings:r.settings,players:[...r.players.values()].map(p=>({id:p.id,mob:p.mob,score:p.score,answered:p.answered})),index:r.index,total:r.questions.length})}
function error(socket,msg){socket.emit('notice',msg)}
function stop(r){if(r.timer)clearTimeout(r.timer);if(r.revealTimer)clearTimeout(r.revealTimer);r.timer=null;r.revealTimer=null}
function finish(r){stop(r);r.phase='finished';emitRoom(r);io.to(r.code).emit('finished')}
function reveal(r){if(r.phase!=='question')return;stop(r);r.phase='reveal';const q=r.questions[r.index];io.to(r.code).emit('reveal',{name:q.name,results:[...r.players.values()].map(p=>({id:p.id,mob:p.mob,score:p.score,earned:p.earned||0,answer:p.answer||'',accuracy:p.acc||0,seconds:p.seconds||null})),index:r.index});emitRoom(r);r.revealTimer=setTimeout(()=>{if(r.phase==='reveal')next(r)},r.settings.revealDuration*1000)}
function next(r){if(r.index+1>=r.questions.length){finish(r);return}r.index++;r.phase='question';r.started=Date.now();r.deadline=r.started+r.settings.duration*1000;for(const p of r.players.values()){p.answered=false;p.earned=0;p.answer='';p.acc=0;p.seconds=null}const q=r.questions[r.index];let choices=[];if(r.settings.mode==='choices'){choices=shuffle([q,...shuffle(r.pool.filter(x=>x.name!==q.name)).slice(0,3)]).map(x=>x.name)}r.choices=choices;emitRoom(r);io.to(r.code).emit('question',{index:r.index,total:r.questions.length,id:q.id,kind:q.kind,region:q.region,type:q.type,choices,duration:r.settings.duration,deadline:r.deadline});emitRoom(r);r.timer=setTimeout(()=>reveal(r),r.settings.duration*1000+250)}
function remove(socket){const code=socket.data.code;if(!code)return;socket.leave(code);socket.data.code=null;const r=rooms.get(code);if(!r)return;r.players.delete(socket.id);if(!r.players.size){stop(r);rooms.delete(code);return}if(r.host===socket.id)r.host=r.players.keys().next().value;emitRoom(r);if(r.phase==='question'&&[...r.players.values()].every(p=>p.answered))reveal(r)}
function identity(raw){const mob=monsters.some(m=>m.id===Number(raw?.mob))?Number(raw.mob):monsters[Math.floor(Math.random()*monsters.length)].id;const m=monsters.find(x=>x.id===mob);return {mob,name:clean(raw?.name,32)||m.name+'#'+Math.floor(100+Math.random()*900)}}
function add(socket,r,raw){remove(socket);const ident=identity(raw);r.players.set(socket.id,{id:socket.id,...ident,score:0,answered:false});socket.join(r.code);socket.data.code=r.code;socket.emit('joined',{id:socket.id,code:r.code});emitRoom(r)}
io.on('connection',socket=>{
 socket.on('create',(raw,ack)=>{let code;do{code=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(code));const r={code,host:socket.id,players:new Map(),phase:'lobby',settings:{},questions:[],pool:[],usedQuestions:new Set(),index:-1,timer:null,revealTimer:null};rooms.set(code,r);add(socket,r,raw);ack?.({ok:true,code})});
 socket.on('join',({code,identity:raw},ack)=>{code=clean(code,8).toUpperCase();const r=rooms.get(code);if(!r)return ack?.({ok:false,error:'Room not found'});if(r.phase!=='lobby')return ack?.({ok:false,error:'Game already started'});if(r.players.size>=30)return ack?.({ok:false,error:'Room is full'});add(socket,r,raw);ack?.({ok:true,code})});
 socket.on('start',settings=>{const r=rooms.get(socket.data.code);if(!r||r.host!==socket.id||r.phase!=='lobby')return;const category=settings?.category==='items'?'items':'monsters';const version=category==='items'?'pre':settings?.version==='renewal'?'renewal':'pre';const mode=settings?.mode==='choices'?'choices':'typing';const region=clean(settings?.region,30),type=clean(settings?.type,30);const duration=Number.isInteger(+settings?.duration)&&+settings.duration>=5&&+settings.duration<=60?+settings.duration:10;const count=[10,20,50].includes(+settings?.count)?+settings.count:20;const revealDuration=Number.isInteger(+settings?.revealDuration)&&+settings.revealDuration>=3&&+settings.revealDuration<=15?+settings.revealDuration:5;const pool=uniqueQuestions((category==='items'?items:monsters).filter(x=>category==='items'?(type==='all'||!type||x.type===type):(region==='all'||!region||x.region===region)));if(!pool.length)return error(socket,'No questions for this filter');r.settings={category,version,mode,region,type,duration,count,revealDuration};r.pool=pool;const unused=pool.filter(x=>!r.usedQuestions.has(x.kind+':'+x.id));const selected=unused.length>=Math.min(count,pool.length)?unused:pool;const chosen=shuffle(selected).slice(0,Math.min(count,selected.length));r.questions=chosen;for(const q of chosen)r.usedQuestions.add(q.kind+':'+q.id);r.index=-1;for(const p of r.players.values())p.score=0;next(r)});
 socket.on('answer',value=>{const r=rooms.get(socket.data.code);if(!r||r.phase!=='question')return;const p=r.players.get(socket.id);if(!p||p.answered)return;const q=r.questions[r.index],elapsed=Math.min(r.settings.duration,Math.max(0,(Date.now()-r.started)/1000));if(elapsed>r.settings.duration+.5)return;const answer=clean(value,90);const acc=r.settings.mode==='choices'?(r.choices.includes(answer)&&answer===q.name?1:0):accuracy(answer,q.name);const speed=Math.max(0,1-elapsed/r.settings.duration);const earned=Math.round(100*(.7*acc+.3*speed*acc));p.score+=earned;p.earned=earned;p.acc=Math.round(acc*100);p.answer=answer;p.seconds=elapsed;p.answered=true;socket.emit('answered',{earned,accuracy:p.acc});emitRoom(r);if([...r.players.values()].every(x=>x.answered))reveal(r)});
 socket.on('next',()=>{const r=rooms.get(socket.data.code);if(r&&r.host===socket.id&&r.phase==='reveal'){stop(r);next(r)}});
 socket.on('restart',()=>{const r=rooms.get(socket.data.code);if(!r||r.host!==socket.id||r.phase!=='finished')return;r.phase='lobby';r.index=-1;r.questions=[];for(const p of r.players.values()){p.score=0;p.answered=false}emitRoom(r)});
 socket.on('disconnect',()=>remove(socket));
});
app.get('/',(req,res)=>{
 const candidates=[path.join(publicDir,'index.html'),path.join(__dirname,'index.html')];
 const found=candidates.find(file=>fs.existsSync(file));
 if(!found)return res.status(503).type('text').send('Game UI missing: upload public/index.html to your GitHub repository.');
 res.sendFile(found);
});
const port=process.env.PORT||3000;server.listen(port,'0.0.0.0',()=>console.log('Ragnarok Multiplayer listening on '+port));
