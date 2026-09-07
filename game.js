let deck=[],discard=[],player=[],bot=[],turn='player',level='easy',locked=false,unoCalled=false;
const colors=['red','yellow','green','blue'];

const $=s=>document.querySelector(s);
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function buildDeck(){
 let d=[];
 for(const c of colors){
  d.push({color:c,type:'number',value:'0'});
  for(let n=1;n<=9;n++)d.push({color:c,type:'number',value:String(n)});
  for(let k=0;k<2;k++){d.push({color:c,type:'skip',value:'⊘'});d.push({color:c,type:'reverse',value:'↻'});d.push({color:c,type:'draw2',value:'+2'})}
 }
 for(let k=0;k<4;k++){d.push({color:'wild',type:'wild',value:'WILD'});d.push({color:'wild',type:'wild4',value:'+4'})}
 return shuffle(d)
}
function newRound(){
 deck=buildDeck();discard=[];player=[];bot=[];unoCalled=false;locked=false;turn='player';
 for(let i=0;i<7;i++){player.push(deck.pop());bot.push(deck.pop())}
 let top=deck.pop();while(top.color==='wild'){deck.unshift(top);top=deck.pop()}discard.push(top);
 render();setStatus('Giliran kamu')
}
function draw(hand){if(!deck.length){let top=discard.pop();deck=shuffle(discard);discard=[top]}return deck.pop()}
function valid(c){let t=discard.at(-1);return c.color==='wild'||c.color===t.color||c.value===t.value}
function renderCard(c,big=false){
 let e=document.createElement('div');e.className=`unoCard ${big?'big ':''}${c.color}`;
 let s=document.createElement('span');s.textContent=c.value;e.appendChild(s);return e
}
function render(){
 $('#difficulty').textContent=level.toUpperCase();$('#botCount').textContent=`${bot.length} kartu`;$('#youCount').textContent=`${player.length} kartu`;$('#deckCount').textContent=deck.length;
 let bh=$('#botHand');bh.innerHTML='';bot.forEach((_,i)=>{let e=document.createElement('div');e.className='backCard';e.style.animationDelay=`${i*28}ms`;bh.appendChild(e)});
 let ph=$('#playerHand');ph.innerHTML='';player.forEach((c,i)=>{let e=renderCard(c);e.style.animationDelay=`${i*25}ms`;e.onclick=()=>playPlayer(i);ph.appendChild(e)});
 let tc=$('#topCard');tc.replaceWith(renderCard(discard.at(-1),true));$('#topCard').id='topCard';
 $('#youDot').classList.toggle('active',turn==='player');$('#botDot').classList.toggle('active',turn==='bot')
}
function setStatus(t){$('#status').textContent=t}
function toast(t){let e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>e.classList.remove('show'),1700)}
function playPlayer(i){
 if(turn!=='player'||locked)return;
 let c=player[i];if(!valid(c)){toast('Kartu tidak cocok');return}
 locked=true;player.splice(i,1);discard.push(c);render();
 if(player.length===0){finish(true);return}
 if(player.length===1){setStatus('Tinggal 1 kartu — panggil UNO!')}
 if(c.type==='wild'||c.type==='wild4'){openColor(c);return}
 effect(c,'player')
}
function openColor(c){
 $('#colorModal').classList.remove('hidden');
 document.querySelectorAll('.colors button').forEach(b=>b.onclick=()=>{c.color=b.dataset.color;$('#colorModal').classList.add('hidden');toast('Warna '+b.dataset.color.toUpperCase());effect(c,'player')})
}
function effect(c,who){
 let next=who==='player'?'bot':'player';
 if(c.type==='skip'||c.type==='reverse')next=who;
 if(c.type==='draw2'){let h=next==='player'?player:bot;h.push(draw(h),draw(h));toast((next==='player'?'Kamu':'Bot')+' mengambil 2 kartu')}
 turn=next;locked=false;render();
 if(turn==='bot'){setStatus('Bot sedang berpikir...');setTimeout(botTurn,650)}else setStatus('Giliran kamu')
}
function botTurn(){
 if(turn!=='bot')return;
 let ids=bot.map((c,i)=>valid(c)?i:-1).filter(i=>i>=0);
 if(!ids.length){let c=draw(bot);render();setTimeout(()=>{if(valid(c))botPlay(bot.length-1);else{turn='player';render();setStatus('Giliran kamu')}},500);return}
 let id;
 if(level==='easy')id=ids[Math.floor(Math.random()*ids.length)];
 else if(level==='hard')id=ids.sort((a,b)=>weight(bot[b])-weight(bot[a]))[0];
 else id=ids.sort((a,b)=>master(bot[b])-master(bot[a]))[0];
 botPlay(id)
}
function weight(c){return c.type==='wild4'?9:c.type==='draw2'?7:c.type==='skip'||c.type==='reverse'?5:1}
function master(c){return weight(c)+(c.color==='wild'?0:bot.filter(x=>x.color===c.color).length*.6)}
function chooseColor(){let count=Object.fromEntries(colors.map(c=>[c,0]));bot.forEach(c=>{if(count[c.color]!=null)count[c.color]++});return colors.sort((a,b)=>count[b]-count[a])[0]}
function botPlay(i){
 let c=bot.splice(i,1)[0];discard.push(c);render();
 if(bot.length===0){finish(false);return}
 if(bot.length===1)toast('🤖 Bot: UNO!');
 if(c.type==='wild'||c.type==='wild4'){setTimeout(()=>{c.color=chooseColor();render();effect(c,'bot')},400);return}
 setTimeout(()=>effect(c,'bot'),420)
}
$('#draw').onclick=()=>{
 if(turn!=='player'||locked)return;
 let c=draw(player);render();toast('Kamu mengambil 1 kartu');
 if(valid(c))setStatus('Kartu yang diambil bisa dimainkan');else{turn='bot';render();setStatus('Bot sedang berpikir...');setTimeout(botTurn,650)}
}
$('#uno').onclick=()=>{if(turn==='player'&&player.length===1){unoCalled=true;toast('🔥 UNO!');setStatus('UNO dipanggil!')}else toast('Panggil UNO saat tinggal 1 kartu')}
function finish(win){turn='none';locked=true;render();setStatus(win?'🏆 Kamu menang!':'🤖 Bot menang!');toast(win?'🏆 KAMU MENANG!':'🤖 BOT MENANG!')}
$('#play').onclick=()=>{$('#home').classList.add('hidden');$('#levels').classList.remove('hidden')};
$('#back').onclick=()=>{$('#levels').classList.add('hidden');$('#home').classList.remove('hidden')};
document.querySelectorAll('.level').forEach(b=>b.onclick=()=>{document.querySelectorAll('.level').forEach(x=>x.classList.remove('active'));b.classList.add('active');level=b.dataset.level;$('#levels').classList.add('hidden');$('#board').classList.remove('hidden');newRound()});
$('#newGame').onclick=()=>newRound();
newRound();
