let deck=[],discard=[],player=[],bot=[],turn='player',level='easy',locked=false,pendingWild=null,unoCalled=false;

const COLORS=['red','yellow','green','blue'];
const COLOR_NAMES={red:'MERAH',yellow:'KUNING',green:'HIJAU',blue:'BIRU'};

const $=s=>document.querySelector(s);

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function buildDeck(){
  const d=[];
  for(const color of COLORS){
    d.push({color,type:'number',value:'0'});
    for(let n=1;n<=9;n++) d.push({color,type:'number',value:String(n)});
    for(let k=0;k<2;k++){
      d.push({color,type:'skip',value:'SKIP'});
      d.push({color,type:'reverse',value:'↻'});
      d.push({color,type:'draw2',value:'+2'});
    }
  }
  for(let k=0;k<4;k++){
    d.push({color:'wild',type:'wild',value:'WILD'});
    d.push({color:'wild',type:'wild4',value:'+4'});
  }
  return shuffle(d);
}

function startRound(){
  deck=buildDeck();discard=[];player=[];bot=[];turn='player';locked=false;pendingWild=null;unoCalled=false;
  for(let i=0;i<7;i++){player.push(deck.pop());bot.push(deck.pop())}
  let top=deck.pop();
  while(top.color==='wild'){deck.unshift(top);top=deck.pop()}
  discard.push(top);
  render();
  setStatus('Giliran kamu — pilih kartu yang menyala ✨');
}

function refillDeck(){
  if(deck.length)return;
  const top=discard.pop();
  deck=shuffle(discard);
  discard=[top];
}

function drawCard(hand){
  refillDeck();
  return deck.pop();
}

function isPlayable(card){
  const top=discard.at(-1);
  if(card.type==='wild4'){
    // Official UNO rule: Wild Draw 4 is playable only if player has no card matching current color.
    const hasColor=player.some(c=>c.color===top.color);
    return !hasColor;
  }
  return card.color==='wild'||card.color===top.color||card.value===top.value;
}

function normalPlayable(card){
  const top=discard.at(-1);
  return card.color==='wild'||card.color===top.color||card.value===top.value;
}

function cardElement(card,big=false){
  const e=document.createElement('div');
  e.className=`unoCard ${big?'big ':''}${card.color}`;
  const s=document.createElement('span');s.textContent=card.value;e.appendChild(s);
  return e;
}

function hasPlayableCard(){
  return player.some(c=>isPlayable(c));
}

function render(){
  $('#levelBadge').textContent=level.toUpperCase();
  $('#botCount').textContent=`${bot.length} kartu`;
  $('#playerCount').textContent=`${player.length} kartu`;
  $('#deckCount').textContent=deck.length;
  const drawBtn=$('#drawBtn');
  const canDraw=turn==='player' && !locked && !hasPlayableCard();
  drawBtn.disabled=!canDraw;
  drawBtn.classList.toggle('disabled',!canDraw);

  const bh=$('#botHand');bh.innerHTML='';
  bot.forEach((_,i)=>{
    const e=document.createElement('div');e.className='backCard';e.style.animationDelay=`${i*25}ms`;bh.appendChild(e)
  });

  const ph=$('#playerHand');ph.innerHTML='';
  player.forEach((c,i)=>{
    const e=cardElement(c);
    if(turn==='player' && isPlayable(c))e.classList.add('playable');
    e.style.animationDelay=`${i*20}ms`;
    e.onclick=()=>playPlayer(i);
    ph.appendChild(e);
  });

  const old=$('#topCard'),fresh=cardElement(discard.at(-1),true);fresh.id='topCard';old.replaceWith(fresh);

  $('#playerDot').classList.toggle('active',turn==='player');
  $('#botDot').classList.toggle('active',turn==='bot');

  if(turn==='player'){
    const playable=player.map((c,i)=>isPlayable(c)?formatCard(c,i):null).filter(Boolean);
    $('#playableInfo').textContent=playable.length
      ? `Bisa dipasang: ${playable.join(' • ')} — AMBIL terkunci`
      : 'Tidak ada kartu yang cocok — tekan AMBIL untuk mengambil 1 kartu';
  }else{
    $('#playableInfo').textContent='Tunggu giliran Bot...';
  }
}

function formatCard(c,i){return `${c.value}${c.color==='wild'?'':` ${COLOR_NAMES[c.color]}`}`}

function setStatus(text){$('#status').textContent=text}

function toast(text){
  const e=$('#toast');e.textContent=text;e.classList.add('show');
  clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>e.classList.remove('show'),1900);
}

function playPlayer(i){
  if(turn!=='player'||locked)return;
  const c=player[i];

  if(!isPlayable(c)){
    if(c.type==='wild4')toast('⛔ +4 hanya boleh jika kamu tidak punya warna kartu jalan');
    else toast('⛔ Kartu ini tidak bisa dipasang');
    return;
  }

  // If player is going down to one card, UNO must be called before playing the final/penultimate card.
  if(player.length===2 && !unoCalled){
    toast('⚠️ Kamu lupa UNO! Ambil 2 kartu.');
    player.push(drawCard(player),drawCard(player));
    render();
    return;
  }

  locked=true;
  player.splice(i,1);
  discard.push({...c});
  unoCalled=false;
  render();

  if(player.length===0){finish(true);return}
  if(player.length===1)setStatus('🔥 Tinggal 1 kartu! Tekan UNO sekarang.');

  if(c.type==='wild'||c.type==='wild4'){
    pendingWild='player';
    $('#colorModal').classList.remove('hidden');
    return;
  }

  applyEffect(c,'player');
}

function chooseColorForBot(){
  const counts={red:0,yellow:0,green:0,blue:0};
  bot.forEach(c=>{if(counts[c.color]!=null)counts[c.color]++});
  return COLORS.reduce((best,c)=>counts[c]>counts[best]?c:best,'red');
}

function applyEffect(card,who){
  let next=who==='player'?'bot':'player';

  // In a two-player UNO game Reverse acts like Skip.
  if(card.type==='skip'||card.type==='reverse')next=who;

  if(card.type==='draw2'){
    const hand=next==='player'?player:bot;
    hand.push(drawCard(hand),drawCard(hand));
    toast(`+2: ${next==='player'?'Kamu':'Bot'} mengambil 2 kartu`);
  }

  turn=next;locked=false;render();

  if(turn==='bot'){
    setStatus('🤖 Bot sedang berpikir...');
    setTimeout(botTurn,700);
  }else{
    setStatus('Giliran kamu — pilih kartu yang menyala ✨');
  }
}

document.querySelectorAll('.colorGrid button').forEach(btn=>{
  btn.onclick=()=>{
    if(pendingWild!=='player')return;
    const color=btn.dataset.color;
    discard.at(-1).color=color;
    pendingWild=null;
    $('#colorModal').classList.add('hidden');
    toast(`Warna berikutnya: ${COLOR_NAMES[color]}`);
    applyEffect(discard.at(-1),'player');
  };
});

function botTurn(){
  if(turn!=='bot'||locked)return;

  const playable=bot.map((c,i)=>normalBotPlayable(c)?i:-1).filter(i=>i>=0);
  let four=bot.map((c,i)=>c.type==='wild4'?i:-1).filter(i=>i>=0);

  let ids=playable.filter(i=>bot[i].type!=='wild4');

  // +4 can only be used when bot has no matching current color.
  const top=discard.at(-1);
  const botHasColor=bot.some(c=>c.color===top.color);
  if(!botHasColor)ids=ids.concat(four);

  if(!ids.length){
    const c=drawCard(bot);
    render();
    toast('🤖 Bot mengambil 1 kartu');
    setTimeout(()=>{
      if(c && (normalBotPlayable(c) || (c.type==='wild4'&&!bot.some(x=>x.color===discard.at(-1).color)))){
        botPlay(bot.length-1);
      }else{
        turn='player';locked=false;render();setStatus('Giliran kamu — pilih kartu yang menyala ✨');
      }
    },550);
    return;
  }

  let id;
  if(level==='easy') id=ids[Math.floor(Math.random()*ids.length)];
  else if(level==='hard') id=ids.sort((a,b)=>weight(bot[b])-weight(bot[a]))[0];
  else id=ids.sort((a,b)=>masterScore(bot[b])-masterScore(bot[a]))[0];

  botPlay(id);
}

function normalBotPlayable(c){
  const top=discard.at(-1);
  return c.color==='wild'||c.color===top.color||c.value===top.value;
}

function weight(c){
  return c.type==='wild4'?9:c.type==='draw2'?7:c.type==='skip'||c.type==='reverse'?5:c.type==='wild'?4:1;
}

function masterScore(c){
  const same=bot.filter(x=>x.color===c.color).length;
  return weight(c)+(c.color==='wild'?0:same*.7);
}

function botPlay(i){
  locked=true;
  const c=bot.splice(i,1)[0];
  discard.push({...c});
  render();

  if(bot.length===0){finish(false);return}
  if(bot.length===1)toast('🤖 Bot: UNO!');

  if(c.type==='wild'||c.type==='wild4'){
    setTimeout(()=>{
      const color=chooseColorForBot();
      discard.at(-1).color=color;
      render();
      toast(`🤖 Bot memilih ${COLOR_NAMES[color]}`);
      applyEffect(discard.at(-1),'bot');
    },450);
    return;
  }

  setTimeout(()=>applyEffect(c,'bot'),450);
}

$('#drawBtn').onclick=()=>{
  if(turn!=='player'||locked)return;
  if(hasPlayableCard()){
    toast('⛔ Masih ada kartu yang bisa dipasang — kamu tidak perlu mengambil');
    return;
  }

  locked=true;
  const btn=$('#drawBtn');
  btn.classList.remove('drawPulse');
  void btn.offsetWidth;
  btn.classList.add('drawPulse');

  const c=drawCard(player);
  if(!c){locked=false;render();toast('Deck habis');return;}
  player.push(c);
  render();

  const cards=[...$('#playerHand').children];
  const received=cards.at(-1);
  if(received){
    received.classList.add('receivingCard');
    received.style.animationDelay='0ms';
  }

  toast(`Kamu mengambil 1 kartu: ${c.value}${c.color==='wild'?'':` ${COLOR_NAMES[c.color]}`}`);

  // Aturan UNO: bila tidak ada kartu yang cocok, ambil 1.
  // Jika kartu yang diambil ternyata cocok, pemain boleh langsung memainkannya.
  if(isPlayable(c)){
    locked=false;
    render();
    setStatus(`Kartu ${formatCard(c)} bisa langsung dipasang — ketuk kartu tersebut`);
  }else{
    turn='bot';
    locked=false;
    render();
    setStatus('Kartu yang diambil tidak cocok. Giliran Bot...');
    setTimeout(botTurn,700);
  }
};

$('#unoBtn').onclick=()=>{
  if(turn!=='player'){toast('Bukan giliran kamu');return}
  if(player.length===1){
    unoCalled=true;toast('🔥 UNO!');setStatus('UNO dipanggil — lanjutkan permainan');
  }else{
    toast('UNO hanya dipanggil saat tersisa 1 kartu');
  }
};

function finish(playerWon){
  turn='none';locked=true;render();
  $('#resultIcon').textContent=playerWon?'🏆':'🤖';
  $('#resultTitle').textContent=playerWon?'Kamu Menang!':'Bot Menang!';
  $('#resultText').textContent=playerWon?'Semua kartu kamu sudah habis.':'Bot berhasil menghabiskan semua kartunya.';
  $('#result').classList.remove('hidden');
}

$('#playBtn').onclick=()=>{
  $('#home').classList.add('hidden');$('#levels').classList.remove('hidden')
};
$('#backBtn').onclick=()=>{
  $('#levels').classList.add('hidden');$('#home').classList.remove('hidden')
};
document.querySelectorAll('.level').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('.level').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');level=btn.dataset.level;
  $('#levels').classList.add('hidden');$('#game').classList.remove('hidden');startRound();
});
$('#restartBtn').onclick=()=>startRound();
$('#againBtn').onclick=()=>{
  $('#result').classList.add('hidden');startRound();
};

startRound();
