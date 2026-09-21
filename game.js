const $=s=>document.querySelector(s), world=$('#world'), game=$('#game');
const levels=[
 {name:'Кредит без сюрпризов',coins:7,monsters:2,lesson:{title:'Микрозайм вместо выгодного кредита',text:'О нет! Ты не проверил условия и вместо понятного кредита взял микрозайм в ООО «Тмыв денег». Теперь ставка — 25% в месяц, а долг растёт быстрее, чем ты бежишь.',tip:'Сравнить полную стоимость кредита, срок, штрафы и условия досрочного погашения. Не подписывать договор, пока непонятен хотя бы один пункт.',link:'https://alfabank.ru/get-money/credit/'}},
 {name:'Подписки‑пожиратели',coins:7,monsters:3,lesson:{title:'Незаметная платная подписка',text:'С пробного периода списалась годовая оплата. Уведомление потерялось, а подпиской ты даже не пользуешься.',tip:'Проверять дату окончания пробного периода, отключать автопродление и регулярно просматривать списания в приложении.',link:'https://alfabank.ru/everyday/online/'}},
 {name:'Фишинг атакует',coins:7,monsters:4,lesson:{title:'Ссылка оказалась поддельной',text:'Сообщение обещало возврат денег, но страница украла данные карты. Настоящий банк не просит назвать код из СМС или полный набор реквизитов.',tip:'Не переходить по ссылкам из неожиданных сообщений. Открывать приложение банка вручную и связываться с поддержкой по официальному номеру.',link:'https://alfabank.ru/help/t/cybersecurity/'}},
 {name:'Рассрочка или кредит?',coins:7,monsters:5,lesson:{title:'«Ноль процентов», но с услугами',text:'Покупка выглядела как беспроцентная рассрочка, но в договор добавили страховку и платные услуги. Итоговая сумма стала заметно выше.',tip:'Смотреть не только ежемесячный платёж, но и общую сумму выплат. Отдельно проверить страховки, комиссии и дополнительные услуги.',link:'https://alfabank.ru/get-money/'}},
 {name:'Финансовая свобода',coins:7,monsters:6,lesson:{title:'Все деньги — в одной корзине',text:'Непредвиденный расход заставил залезть в долг: свободных денег не осталось, потому что всё было потрачено или вложено без резерва.',tip:'Собирать подушку безопасности постепенно — начать хотя бы с небольшой автоматической суммы после каждого поступления.',link:'https://alfabank.ru/make-money/'}},
];
let state={level:0,total:0,levelCoins:0,traps:0,avatar:'girl',running:false};
let player={x:60,y:0,vx:0,vy:0,w:54,h:70,onGround:false,jumps:0,spinning:false,facing:1};
let keys={left:false,right:false,jump:false}, entities=[], raf, last=0;
const palettes=['#ef3124','#ff5b37','#e4212c','#ff3b22','#d71920'];
function platform(x,y,size){const dimensions={long:[380,90],medium:[300,90],short:[170,90]}[size];return {type:'platform',x,y,w:dimensions[0],h:dimensions[1],size}}
function buildLevel(){
  world.innerHTML='';entities=[];state.levelCoins=0;state.traps=0;$('#levelNo').textContent=state.level+1;$('#coins').textContent=state.total;
  const W=game.clientWidth,H=game.clientHeight; document.documentElement.style.setProperty('--red',palettes[state.level]);
  const scale=Math.min(1,Math.max(.62,W/1050));
  const plats=[];
  const floorY=H-90*scale,step=Math.min(130,(floorY-36)/3);
  for(let x=0;x<W;x+=380*scale)plats.push(platform(x,floorY,'long'));
  const floating=[
    platform(W*.16,floorY-step,'short'),
    platform(W*.36,floorY-step*2,'medium'),
    platform(W*.68,floorY-step,'short'),
    platform(Math.max(12,W-380*scale),floorY-step*3,'long')
  ];
  plats.push(...floating);
  plats.forEach(p=>{p.w*=scale;p.h*=scale;p.x=Math.min(p.x,W-p.w)});
  plats.forEach(p=>add(p));
  const cfg=levels[state.level];
  const [low,mid,lowRight,high]=floating;
  const coinSpots=[
    [W*.07,floorY-56],
    [low.x+low.w*.22,low.y-54],
    [low.x+low.w*.68,low.y-54],
    [mid.x+mid.w*.25,mid.y-54],
    [mid.x+mid.w*.72,mid.y-54],
    [lowRight.x+lowRight.w*.45,lowRight.y-54],
    [high.x+high.w*.68,high.y-54]
  ];
  coinSpots.slice(0,cfg.coins).forEach(([x,y])=>add({type:'coin',x:Math.min(W-44,x),y,w:42,h:42,collected:false}));
  for(let i=0;i<cfg.monsters;i++){const p=plats[(i+1)%plats.length];add({type:'monster',x:p.x+Math.max(12,(i*73)%Math.max(20,p.w-70)),y:p.y-64,w:64,h:64,dir:i%2?1:-1,min:p.x,max:p.x+p.w-64,speed:35+state.level*7});}
  add({type:'flag',x:Math.max(30,W-92),y:H-90*scale-84,w:68,h:84});
  player={x:35,y:H-175,vx:0,vy:0,w:54,h:70,onGround:false,jumps:0,spinning:false,facing:1};
  const el=document.createElement('div');el.id='player';el.className='entity player '+state.avatar;renderAvatar(el);world.appendChild(el);
  state.running=true;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);game.focus();
}
function renderAvatar(el){const sprites={girl:'assets/alfagirl2.svg',boy:'assets/human-boy.svg',cat:'assets/cat.svg'};el.innerHTML=`<img class="playerSprite" src="${sprites[state.avatar]}" alt="">`}
function add(e){entities.push(e);const el=document.createElement('div');el.className='entity '+e.type+(e.size?' '+e.size:'');el.dataset.i=entities.length-1;if(e.type==='platform'){el.style.width=e.w+'px';el.style.height=e.h+'px'}world.appendChild(el)}
function rects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function loop(t){if(!state.running)return;const dt=Math.min(.032,(t-last)/1000);last=t;update(dt);draw();raf=requestAnimationFrame(loop)}
function update(dt){
  const W=game.clientWidth,H=game.clientHeight;player.vx=(keys.right?225:0)-(keys.left?225:0);if(player.vx)player.facing=player.vx>0?1:-1;player.vy+=1180*dt;
  const oldY=player.y;player.x+=player.vx*dt;player.y+=player.vy*dt;player.x=Math.max(0,Math.min(W-player.w,player.x));player.onGround=false;
  for(const e of entities.filter(e=>e.type==='platform'))if(player.vy>=0&&oldY+player.h<=e.y+14&&player.y+player.h>=e.y&&player.x+player.w>e.x+6&&player.x<e.x+e.w-6){player.y=e.y-player.h;player.vy=0;player.onGround=true;player.jumps=0;player.spinning=false}
  if(player.y>H+80)hitTrap();
  entities.forEach(e=>{if(e.type==='monster'){e.x+=e.dir*e.speed*dt;if(e.x<e.min||e.x>e.max)e.dir*=-1;if(rects(player,e))hitTrap()}if(e.type==='coin'&&!e.collected&&rects(player,e)){e.collected=true;state.levelCoins++;state.total++;$('#coins').textContent=state.total;const node=world.querySelector(`[data-i="${entities.indexOf(e)}"]`);if(node)node.remove()}if(e.type==='flag'&&rects(player,e))finishLevel()});
}
function draw(){const p=$('#player');if(p){const naturalFacing=state.avatar==='girl'?-1:1;p.classList.toggle('spinning',player.spinning);p.style.transform=`translate(${player.x}px,${player.y}px) scaleX(${player.facing*naturalFacing})`}entities.forEach((e,i)=>{const el=world.querySelector(`[data-i="${i}"]`);if(el)el.style.transform=`translate(${e.x}px,${e.y}px)`})}
function jump(){if(!state.running||player.jumps>=2)return;player.vy=player.jumps===0?-600:-555;player.onGround=false;player.jumps++;player.spinning=player.jumps===2}
let trapLock=false;function hitTrap(){if(trapLock||!state.running)return;trapLock=true;state.running=false;state.traps++;const l=levels[state.level].lesson;$('#lessonTitle').textContent=l.title;$('#lessonText').textContent=l.text;$('#lessonTip').textContent=l.tip;$('#lessonLink').href=l.link;$('#lessonDialog').showModal()}
function finishLevel(){if(!state.running)return;state.running=false;const cfg=levels[state.level];$('#levelCoins').textContent=state.levelCoins+'/'+cfg.coins;$('#levelTraps').textContent=state.traps;$('#totalCoins').textContent=state.total;$('#resultText').textContent=state.levelCoins===cfg.coins?'Ты собрал все монеты. Копилка довольна!':'Можно было собрать ещё '+(cfg.coins-state.levelCoins)+' — но главное, ты добрался до цели.';$('#nextBtn').textContent=state.level===4?'ПОСМОТРЕТЬ ИТОГИ →':'СЛЕДУЮЩИЙ УРОВЕНЬ →';$('#resultDialog').showModal()}
function chooseAvatar(e){document.querySelectorAll('.avatar').forEach(a=>a.classList.remove('selected'));e.currentTarget.classList.add('selected');state.avatar=e.currentTarget.dataset.avatar}
document.querySelectorAll('.avatar').forEach(a=>a.addEventListener('click',chooseAvatar));
$('#startBtn').onclick=async()=>{$('#startDialog').close();state.level=0;state.total=0;try{if(matchMedia('(max-width: 960px)').matches&&!document.fullscreenElement)await document.documentElement.requestFullscreen?.();await screen.orientation?.lock?.('landscape')}catch{}buildLevel()};
$('#retryBtn').onclick=()=>{$('#lessonDialog').close();state.total-=state.levelCoins;trapLock=false;buildLevel()};
$('#nextBtn').onclick=()=>{$('#resultDialog').close();if(state.level===4){$('#finalCoins').textContent=state.total;$('#finalDialog').showModal()}else{state.level++;buildLevel()}};
$('#againBtn').onclick=()=>{$('#finalDialog').close();$('#startDialog').showModal()};
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','ArrowUp'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')keys.left=true;if(e.key==='ArrowRight')keys.right=true;if((e.key===' '||e.key==='ArrowUp')&&!e.repeat)jump()});
addEventListener('keyup',e=>{if(e.key==='ArrowLeft')keys.left=false;if(e.key==='ArrowRight')keys.right=false});
document.querySelectorAll('.mobileControls button').forEach(b=>{const k=b.dataset.key;const on=e=>{e.preventDefault();if(k==='jump')jump();else keys[k]=true};const off=e=>{e.preventDefault();if(k!=='jump')keys[k]=false};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off)});
$('#soundBtn').onclick=()=>{$('#soundBtn').textContent=$('#soundBtn').textContent==='♪'?'×':'♪'};
addEventListener('resize',()=>{if(state.running)buildLevel()});

// Optional WebMCP controls: mirrors the same actions available in the UI.
const modelContext=document.modelContext;
if(modelContext?.registerTool){
  const webmcpLife=new AbortController();
  const register=tool=>Promise.resolve(modelContext.registerTool(tool,{signal:webmcpLife.signal})).catch(()=>{});
  register({name:'start_money_run',title:'Начать денежный забег',description:'Выбрать аватар и начать игру с первого уровня.',inputSchema:{type:'object',properties:{avatar:{type:'string',enum:['girl','boy','cat']}},required:['avatar'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:({avatar})=>{if(!['girl','boy','cat'].includes(avatar))throw new Error('Неизвестный аватар');state.avatar=avatar;state.level=0;state.total=0;if($('#startDialog').open)$('#startDialog').close();buildLevel();return {status:'started',avatar,level:1}}});
  register({name:'get_money_run_status',title:'Статус денежного забега',description:'Показать текущий уровень, собранные монеты и число финансовых ловушек.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({level:state.level+1,levelName:levels[state.level].name,coins:state.total,levelCoins:state.levelCoins,traps:state.traps,running:state.running})});
}
