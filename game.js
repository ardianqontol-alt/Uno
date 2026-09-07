let deck=[],discard=[],player=[],bot=[],turn='player',level='easy',locked=false,pendingWildOwner=null,unoReady=false;
const COLORS=['red','yellow','green','blue'];
const COLOR_NAMES={red:'MERAH',yellow:'KUNING',green:'HIJAU',blue:'BIRU'};
const $=s=>document.querySelector(s);

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function buildDeck(){
  const d=[];
  for(const color of COLORS){
    d.push({color,type:'number',value:'0'});
    for(let n=1;n<=9;n++)d.push({color,type:'number',value:String(n)});
    for(let k=0;k<2;k++){
      d.push({color,type:'skip',value:'SKIP'});
      d.push({color,type:'reverse',value:'REVERSE'});
      d.push({color,type:'draw2',value:'+2'});
      // House-rule extras requested by the user.
      d.push({color,type:'draw1',value:'+1'});
      d.push({color,type:'draw5',value:'+5'});
    }
  }
  for(let k=0;k<4;k++){
    d.push({color:'wild',type:'wild',value:'WILD'});
    d.push({color:'wild',type:'wild4',value:'+4'});
  }
  return shuffle(d);
}

function fairInitialHand(hand){
  // House-rule balance: maksimal 4 action/wild pada opening hand.
  // Ini hanya mencegah start yang ekstrem, bukan memberi keuntungan tersembunyi.
  let guard=0;
  while(hand.filter(c=>['skip','reverse','draw2','draw1','draw5','wild','wild4'].includes(c.type)).length>4 && guard++<10){
    const idx=hand.findIndex(c=>['skip','reverse','draw2','draw1','draw5','wild','wild4'].includes(c.type));
    if(idx<0||!deck.length)break;
    const replacement=deck.pop();
    deck.unshift(hand[idx]);
    hand[idx]=replacement;
  }
}
function startRound(){
  $('#result')?.classList.add('hidden');
  deck=buildDeck();discard=[];player=[];bot=[];turn='player';locked=false;pendingWildOwner=null;unoReady=false;
  for(let i=0;i<7;i++){player.push(deck.pop());bot.push(deck.pop())}
  // Distribusi awal yang wajar: jika tangan seseorang terlalu penuh kartu aksi,
  // tukar beberapa kartu dengan deck. Tidak melihat kartu lawan.
  fairInitialHand(player); fairInitialHand(bot);
  let top=deck.pop();
  while(top.color==='wild'){deck.unshift(top);top=deck.pop()}
  discard=[top];render();setStatus('Giliran kamu — pasang kartu yang cocok.');
}

function refillDeck(){
  if(deck.length||discard.length<=1)return;
  const top=discard.pop();deck=shuffle(discard);discard=[top];
}
function takeCard(hand){refillDeck();if(!deck.length)return null;const c=deck.pop();hand.push(c);return c}
function hasPlayable(hand){return hand.some(c=>isPlayable(c,hand))}
function isPlayable(card,hand){
  const top=discard.at(-1);if(!top)return true;
  if(card.type==='wild')return true;
  if(card.type==='wild4')return !hand.some(c=>c!==card&&c.color===top.color);
  return card.color===top.color||card.value===top.value;
}
function botPlayable(card){const top=discard.at(-1);if(card.type==='wild')return true;if(card.type==='wild4')return !bot.some(c=>c.color===top.color&&c!==card);return card.color===top.color||card.value===top.value}
function cardElement(card,big=false){const e=document.createElement('div');e.className=`unoCard ${big?'big ':''}${card.color}`;const s=document.createElement('span');s.textContent=card.value;e.appendChild(s);return e}
function cardLabel(c){return c.value+(c.color==='wild'?'':` ${COLOR_NAMES[c.color]}`)}
function setStatus(t){$('#status').textContent=t}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>e.classList.remove('show'),1900)}

function render(){
  $('#levelBadge').textContent=level.toUpperCase();
  $('#botCount').textContent=`${bot.length} kartu`;$('#playerCount').textContent=`${player.length} kartu`;$('#deckCount').textContent=deck.length;
  $('#drawBtn').disabled=!(turn==='player'&&!locked&&!hasPlayable(player));
  const unoCan=turn==='player'&&!locked&&player.length===2&&!unoReady;
  $('#unoBtn').disabled=!unoCan;$('#unoBtn').textContent=unoCan?'UNO! (SEBELUM PASANG)':'UNO!';

  const bh=$('#botHand');bh.innerHTML='';bot.forEach((_,i)=>{const e=document.createElement('div');e.className='backCard';e.style.animationDelay=`${i*20}ms`;bh.appendChild(e)});
  const ph=$('#playerHand');ph.innerHTML='';player.forEach((c,i)=>{const e=cardElement(c);if(turn==='player'&&isPlayable(c,player))e.classList.add('playable');e.style.animationDelay=`${i*18}ms`;e.onclick=()=>playPlayer(i);ph.appendChild(e)});
  const old=$('#topCard'),fresh=cardElement(discard.at(-1),true);fresh.id='topCard';old.replaceWith(fresh);

  $('#playerDot').classList.toggle('active',turn==='player');$('#botDot').classList.toggle('active',turn==='bot');
  if(turn==='player'){
    const p=player.filter(c=>isPlayable(c,player));
    $('#playableInfo').textContent=p.length?`Bisa dipasang: ${p.map(cardLabel).join(' • ')}`:'Tidak ada kartu yang cocok — DRAW / AMBIL 1 kartu.';
  }else $('#playableInfo').textContent='Bot sedang bermain…';
}

function animateDraw(target,count,after){
  const source=$('#drawBtn').getBoundingClientRect();
  const targetEl=target==='player'?$('#playerHand'):$('#botHand');
  const targetRect=targetEl.getBoundingClientRect();
  const hand=target==='player'?player:bot;
  const drawn=[];for(let i=0;i<count;i++){const c=takeCard(hand);if(c)drawn.push(c)}
  render();
  const layer=$('#flyLayer');
  drawn.forEach((c,i)=>{
    const el=document.createElement('div');el.className=`flying ${target==='bot'?'back':c.color}`;el.textContent=target==='bot'?'UNO':c.value;
    const sx=source.left+source.width/2-24,sy=source.top+source.height/2-36;
    el.style.left=`${sx}px`;el.style.top=`${sy}px`;layer.appendChild(el);
    const tx=targetRect.left+targetRect.width/2-24+(i-(drawn.length-1)/2)*10,ty=targetRect.top+targetRect.height/2-36;
    requestAnimationFrame(()=>el.animate([{transform:'translate(0,0) scale(.68) rotate(-3deg)',opacity:.3},{transform:`translate(${tx-sx}px,${ty-sy}px) scale(1) rotate(${i%2?4:-4}deg)`,opacity:1}],{duration:560+i*85,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}).onfinish=()=>el.remove());
  });
  const db=$('#drawBtn');db.classList.remove('drawPulse');void db.offsetWidth;db.classList.add('drawPulse');
  toast(`🎴 ${target==='player'?'Kamu':'Bot'} mengambil ${drawn.length} kartu`);
  setTimeout(()=>after(drawn),Math.min(1050,580+drawn.length*85));
}

function callUno(){
  if(turn!=='player'||locked)return;
  if(player.length!==2){toast('UNO ditekan saat tersisa 2 kartu, sebelum memasang kartu kedua-terakhir.');return}
  unoReady=true;render();setStatus('🔥 UNO dipanggil! Sekarang pasang satu kartu untuk menyisakan 1.');toast('UNO! ✅');
}

function playPlayer(i){
  if(turn!=='player'||locked)return;
  const c=player[i];if(!isPlayable(c,player)){toast('⛔ Kartu ini tidak bisa dipasang.');return}
  if(player.length===2&&!unoReady){toast('⚠️ Tekan UNO! saat masih punya 2 kartu, sebelum memasang kartu kedua-terakhir.');return}
  locked=true;const didCall=unoReady;player.splice(i,1);discard.push({...c});unoReady=false;render();
  if(player.length===0){finish(true);return}
  if(player.length===1)setStatus(didCall?'🔥 UNO benar! Kamu tinggal 1 kartu.':'⚠️ UNO tidak dipanggil sebelum kartu kedua-terakhir dipasang.');
  if(c.type==='wild'||c.type==='wild4'){pendingWildOwner='player';$('#colorModal').classList.remove('hidden');return}
  applyEffect(c,'player');
}

function chooseBotColor(){
  const count={red:0,yellow:0,green:0,blue:0};bot.forEach(c=>{if(count[c.color]!=null)count[c.color]++});return COLORS.slice().sort((a,b)=>count[b]-count[a])[0];
}
function botChooseIndex(){
  const top=discard.at(-1);
  const hasTopColor=bot.some(c=>c.color===top.color);
  const playable=bot.map((c,i)=>({c,i})).filter(x=>{
    if(x.c.type==='wild4') return !hasTopColor;
    return botPlayable(x.c);
  });
  if(!playable.length)return -1;

  // Bot tidak boleh mengetahui kartu pemain. Untuk menjaga permainan adil,
  // EASY sering memilih kartu biasa secara acak, HARD memakai strategi ringan,
  // MASTER lebih cerdas tetapi tetap tidak sempurna.
  if(level==='easy'){
    const normal=playable.filter(x=>!['wild4','draw5'].includes(x.c.type));
    const pool=normal.length?normal:playable;
    return pool[Math.floor(Math.random()*pool.length)].i;
  }

  function score(c){
    let s=Math.random()*3; // selalu ada variasi, tidak deterministik
    if(c.type==='number')s+=3;
    if(c.type==='draw1')s+=2;
    if(c.type==='draw2')s+=2.5;
    if(c.type==='skip'||c.type==='reverse')s+=2;
    if(c.type==='wild')s+=1;
    if(c.type==='draw5')s+=2.5;
    if(c.type==='wild4')s+=2;
    // Jangan membuang kartu wild terlalu cepat.
    if(c.color==='wild')s-= level==='hard'?1.5:0.5;
    // Utamakan warna yang paling banyak dimiliki bot, bukan kartu yang
    // paling menyakitkan bagi pemain.
    if(c.color!=='wild')s+=bot.filter(x=>x.color===c.color).length*.7;
    return s;
  }

  // HARD: kadang mengambil keputusan biasa supaya tidak terasa curang.
  if(level==='hard' && Math.random()<0.32){
    const normal=playable.filter(x=>x.c.type==='number'||x.c.type==='skip'||x.c.type==='reverse');
    if(normal.length)return normal[Math.floor(Math.random()*normal.length)].i;
  }

  playable.sort((a,b)=>score(b.c)-score(a.c));
  // MASTER juga punya peluang kecil memilih kandidat kedua.
  if(level==='master' && playable.length>1 && Math.random()<0.22)return playable[1].i;
  return playable[0].i;
}

function botTurn(){
  if(turn!=='bot'||locked)return;
  const idx=botChooseIndex();
  if(idx===-1){
    locked=true;
    animateDraw('bot',1,(drawn)=>{
      locked=false;const c=drawn[0];
      if(c&&botPlayable(c)){setStatus('🤖 Bot mendapatkan kartu yang bisa dimainkan.');setTimeout(()=>botPlay(bot.length-1),280)}
      else{turn='player';render();setStatus('Bot tidak punya kartu yang cocok. Giliran kamu.')} });
    return;
  }
  botPlay(idx);
}

function botPlay(i){
  if(turn!=='bot'||locked)return;
  locked=true;const c=bot.splice(i,1)[0];discard.push({...c});render();
  if(bot.length===0){finish(false);return}
  if(bot.length===1)toast('🤖 Bot: UNO!');
  if(c.type==='wild'||c.type==='wild4'){
    setTimeout(()=>{discard.at(-1).color=chooseBotColor();render();toast(`🤖 Bot memilih ${COLOR_NAMES[discard.at(-1).color]}`);applyEffect(c,'bot')},450);return;
  }
  setTimeout(()=>applyEffect(c,'bot'),450);
}

function applyEffect(card,who){
  const next=who==='player'?'bot':'player';
  if(card.type==='skip'||card.type==='reverse'){
    locked=false;turn=who;render();
    if(turn==='bot'){setStatus(`⏭️ ${card.value==='REVERSE'?'REVERSE':'SKIP'} — giliran Bot lagi.`);setTimeout(botTurn,650)}
    else setStatus(`⏭️ ${card.value==='REVERSE'?'REVERSE':'SKIP'} — giliran kamu lagi.`);
    return;
  }
  let n=0;if(card.type==='draw2')n=2;if(card.type==='draw1')n=1;if(card.type==='draw5')n=5;
  if(n){locked=true;animateDraw(next,n,()=>{turn=who;locked=false;render();if(turn==='bot'){setStatus(`🤖 Bot mengambil ${n} kartu karena ${card.value}. Gilirannya kembali ke Bot.`);setTimeout(botTurn,700)}else setStatus(`Kamu mengambil ${n} kartu karena ${card.value}. Giliran kamu lagi.`)});return}
  turn=next;locked=false;render();if(turn==='bot'){setStatus('🤖 Bot sedang berpikir...');setTimeout(botTurn,700)}else setStatus('Giliran kamu — pasang kartu yang cocok.');
}

document.querySelectorAll('.colorGrid button').forEach(btn=>btn.onclick=()=>{if(pendingWildOwner!=='player')return;discard.at(-1).color=btn.dataset.color;pendingWildOwner=null;$('#colorModal').classList.add('hidden');toast(`Warna berikutnya: ${COLOR_NAMES[btn.dataset.color]}`);applyEffect(discard.at(-1),'player')});

$('#drawBtn').onclick=()=>{
  if(turn!=='player'||locked)return;
  if(hasPlayable(player)){toast('⛔ Kamu masih punya kartu yang bisa dipasang.');return}
  locked=true;
  animateDraw('player',1,(drawn)=>{locked=false;const c=drawn[0];if(c&&isPlayable(c,player)){render();setStatus(`Kartu yang diambil bisa langsung dipasang: ${cardLabel(c)}`)}else{turn='bot';render();setStatus('Kartu yang diambil tidak cocok. Giliran Bot...');setTimeout(botTurn,700)}});
};
$('#unoBtn').onclick=callUno;
function finish(win){turn='none';locked=true;render();$('#resultIcon').textContent=win?'🏆':'🤖';$('#resultTitle').textContent=win?'Kamu Menang!':'Bot Menang!';$('#resultText').textContent=win?'Semua kartu kamu sudah habis.':'Bot berhasil menghabiskan semua kartunya.';$('#result').classList.remove('hidden')}
$('#playBtn').onclick=()=>{$('#home').classList.add('hidden');$('#levels').classList.remove('hidden')};
$('#backBtn').onclick=()=>{$('#levels').classList.add('hidden');$('#home').classList.remove('hidden')};
document.querySelectorAll('.level').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.level').forEach(x=>x.classList.remove('active'));btn.classList.add('active');level=btn.dataset.level;$('#levels').classList.add('hidden');$('#game').classList.remove('hidden');startRound()});
$('#restartBtn').onclick=()=>startRound();$('#againBtn').onclick=()=>startRound();
startRound();
