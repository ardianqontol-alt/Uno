const $=s=>document.querySelector(s);
let level='easy',deck=[],discard=[],player=[],bot=[],turn='player',unoCalled=false,busy=false;

const COLORS=['red','yellow','green','blue'];
const TYPES=['number','skip','reverse','draw2'];

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function makeDeck(){
  const d=[];
  for(const c of COLORS){
    d.push({color:c,type:'number',value:0});
    for(let n=1;n<=9;n++)d.push({color:c,type:'number',value:n});
    for(const t of TYPES.slice(1))for(let k=0;k<2;k++)d.push({color:c,type:t,value:t==='skip'?'SKIP':t==='reverse'?'↻':'+2'});
  }
  for(let k=0;k<4;k++)d.push({color:'wild',type:'wild',value:'WILD'});
  for(let k=0;k<4;k++)d.push({color:'wild',type:'wild4',value:'+4'});
  return shuffle(d);
}
function deal(){
  deck=makeDeck();player=[];bot=[];discard=[];unoCalled=false;
  for(let i=0;i<7;i++){player.push(deck.pop());bot.push(deck.pop())}
  let top=deck.pop();
  while(top.color==='wild'){deck.unshift(top);top=deck.pop()}
  discard=[top];turn='player';render();setStatus('Giliran kamu');busy=false;
}
function cardText(c){return c.value}
function valid(c){
  const top=discard.at(-1);
  return c.color==='wild'||c.color===top.color||c.value===top.value;
}
function render(){
  $('#levelBadge').textContent=level.toUpperCase();
  $('#botCount').textContent=`${bot.length} kartu`;
  $('#playerCount').textContent=`${player.length} kartu`;
  $('#deckCount').textContent=deck.length;
  const bh=$('#botHand');bh.innerHTML='';
  bot.forEach((_,i)=>{const e=document.createElement('div');e.className='backcard';e.style.animationDelay=`${i*35}ms`;bh.appendChild(e)});
  const ph=$('#playerHand');ph.innerHTML='';
  player.forEach((c,i)=>{
    const e=document.createElement('div');e.className=`card ${c.color}`;
    const s=document.createElement('span');s.textContent=cardText(c);e.appendChild(s);
    e.style.animationDelay=`${i*30}ms`;
    e.onclick=()=>playPlayer(i);ph.appendChild(e);
  });
  const top=discard.at(-1),ce=$('#currentCard');ce.className=`card large ${top.color}`;
  ce.innerHTML=`<span>${cardText(top)}</span>`;
  $('#playerTurn').classList.toggle('on',turn==='player');
  $('#botTurn').classList.toggle('on',turn==='bot');
}
function setStatus(t){$('#status').textContent=t}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>e.classList.remove('show'),1800)}
function drawOne(hand){if(!deck.length){const top=discard.pop();deck=shuffle(discard);discard=[top]}return deck.pop()}

function drawPlayer(){
  if(turn!=='player'||busy)return;
  const c=drawOne(player);toast(`Ambil ${c.value}`);
  render();
  if(valid(c)){setStatus('Kartu yang diambil bisa dimainkan.');}
  else {turn='bot';render();setStatus('Bot berpikir...');setTimeout(botTurn,650)}
}
function playPlayer(i){
  if(turn!=='player'||busy)return;
  const c=player[i];
  if(!valid(c)){toast('Kartu tidak bisa dimainkan');return}
  busy=true;
  player.splice(i,1);discard.push(c);unoCalled=false;
  render();
  const e=[...$('#playerHand').children][i];if(e)e.classList.add('playing');
  if(player.length===0){win(true);return}
  if(player.length===1&&!unoCalled)toast('Kamu tinggal 1 kartu — tekan UNO!');
  if(c.type==='wild'||c.type==='wild4'){openColor(c);return}
  applyEffect(c,'player');
}
function applyEffect(c,who){
  let next=who==='player'?'bot':'player';
  if(c.type==='skip'||c.type==='reverse')next=who;
  if(c.type==='draw2'){const h=next==='player'?player:bot;h.push(drawOne(h),drawOne(h));toast(`${next==='player'?'Kamu':'Bot'} mengambil 2 kartu`)}
  turn=next;busy=false;render();
  if(turn==='bot'){setStatus('Bot berpikir...');setTimeout(botTurn,700)}else setStatus('Giliran kamu');
}
function openColor(c){
  if(c.type==='wild4'&&turn==='bot'){const col=chooseColor(bot);c.color=col;setStatus(`Bot memilih ${col}`);setTimeout(()=>applyEffect(c,'bot'),400);return}
  $('#colorModal').classList.remove('hidden');
  $('#colorModal').dataset.cardType=c.type;
}
document.querySelectorAll('.colorChoices button').forEach(b=>b.onclick=()=>{
  const col=b.dataset.color,c=discard.at(-1);c.color=col;
  $('#colorModal').classList.add('hidden');toast(`Warna ${col.toUpperCase()}`);
  applyEffect(c,'player');
});
function chooseColor(hand){let counts=Object.fromEntries(COLORS.map(c=>[c,0]));hand.forEach(x=>{if(counts[x.color]!=null)counts[x.color]++});return COLORS.sort((a,b)=>counts[b]-counts[a])[0]}
function botTurn(){
  if(turn!=='bot')return;
  let validIdx=bot.map((c,i)=>valid(c)?i:-1).filter(i=>i>=0);
  if(!validIdx.length){bot.push(drawOne(bot));render();setTimeout(()=>{const i=bot.length-1;if(valid(bot[i]))botPlay(i);else{turn='player';busy=false;render();setStatus('Giliran kamu') }},500);return}
  let idx;
  if(level==='easy')idx=validIdx[Math.floor(Math.random()*validIdx.length)];
  else if(level==='hard')idx=validIdx.sort((a,b)=>score(bot[b])-score(bot[a]))[0];
  else idx=validIdx.sort((a,b)=>masterScore(bot[b])-masterScore(bot[a]))[0];
  botPlay(idx);
}
function score(c){return c.type==='wild4'?8:c.type==='draw2'?6:c.type==='skip'||c.type==='reverse'?4:1}
function masterScore(c){return score(c)+(c.color!=='wild'&&bot.filter(x=>x.color===c.color).length*0.7)}
function botPlay(i){
  const c=bot.splice(i,1)[0];discard.push(c);render();
  if(bot.length===0){win(false);return}
  if(bot.length===1)toast('🤖 Bot: UNO!');
  if(c.type==='wild'||c.type==='wild4'){setTimeout(()=>{if(c.type==='wild4'&&player.length<=2){toast('⚡ Bot memakai +4')}c.color=chooseColor(bot);render();applyEffect(c,'bot')},450);return}
  setTimeout(()=>applyEffect(c,'bot'),450);
}
function callUno(){
  if(turn!=='player')return;
  if(player.length===1){unoCalled=true;toast('🔥 UNO!');setStatus('UNO dipanggil!');}
  else toast('UNO hanya saat tersisa 1 kartu');
}
function win(playerWon){
  busy=true;turn='none';render();
  setTimeout(()=>alert(playerWon?'🏆 KAMU MENANG!':'🤖 BOT MENANG!'),100);
  setStatus(playerWon?'🏆 Kemenangan!':'🤖 Bot memenangkan permainan');
}
$('#startBtn').onclick=()=>{$('#home').classList.add('hidden');$('#difficulty').classList.remove('hidden')};
$('#backHome').onclick=()=>{$('#difficulty').classList.add('hidden');$('#home').classList.remove('hidden')};
document.querySelectorAll('.level').forEach(b=>b.onclick=()=>{document.querySelectorAll('.level').forEach(x=>x.classList.remove('active'));b.classList.add('active');level=b.dataset.level;deal();$('#difficulty').classList.add('hidden');$('#game').classList.remove('hidden')});
$('#drawBtn').onclick=drawPlayer;
$('#unoBtn').onclick=callUno;
$('#restartBtn').onclick=()=>deal();
deal();