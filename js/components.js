/* Wiederverwendbare Bausteine: DOM-Helfer, Item-Renderer (alle Typen aus practice.json), Drag-and-drop, Video */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function h(tag,attrs,...kids){const e=document.createElement(tag);
    for(const[k,v]of Object.entries(attrs||{})){if(v==null||v===false)continue;
      if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(k==='html')e.innerHTML=v;else if(k==='class')e.className=v;else e.setAttribute(k,v===true?'':v);}
    for(const k of kids.flat(Infinity)){if(k==null||k===false)continue;e.append(k.nodeType?k:document.createTextNode(k));}return e;}
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const norm=s=>String(s).trim().toLowerCase().replace(/\s+/g,' ');
  function parseNum(s){s=String(s).trim().replace(/\s|\u00a0/g,'');if(!s)return NaN;
    if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    else if(/^-?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
    return Number(s);}
  const TYPE={single:'Einfachauswahl',multiple:'Mehrfachauswahl',numeric:'Rechenaufgabe',cloze:'Lückentext',matching:'Zuordnen (Drag-and-drop)',ordering:'Reihenfolge',categorize:'Kategorisieren (Drag-and-drop)',open:'Offene Aufgabe'};

  /* ---------- Drag-and-drop mit Klick-/Tastatur-Alternative ---------- */
  function makeDnd(root){
    let sel=null, dragEl=null;
    root.addEventListener('dragstart',e=>{const c=e.target.closest('.chip');if(!c)return;dragEl=c;e.dataTransfer.setData('text/plain',c.dataset.k);e.dataTransfer.effectAllowed='move';});
    root.addEventListener('dragover',e=>{const z=e.target.closest('.zone,.pool');if(z){e.preventDefault();z.classList.add('over');}});
    root.addEventListener('dragleave',e=>{const z=e.target.closest('.zone,.pool');if(z)z.classList.remove('over');});
    root.addEventListener('drop',e=>{const z=e.target.closest('.zone,.pool');if(!z)return;e.preventDefault();z.classList.remove('over');
      const k=e.dataTransfer.getData('text/plain');const c=dragEl||root.querySelector(`.chip[data-k="${k}"]`);if(c)place(c,z);dragEl=null;});
    root.addEventListener('click',e=>{const c=e.target.closest('.chip');
      if(c){e.stopPropagation();if(sel===c){c.setAttribute('aria-pressed','false');sel=null;return;}
        if(sel)sel.setAttribute('aria-pressed','false');sel=c;c.setAttribute('aria-pressed','true');return;}
      const z=e.target.closest('.zone,.pool');if(z&&sel){place(sel,z);sel.setAttribute('aria-pressed','false');sel.focus();sel=null;}});
    root.addEventListener('keydown',e=>{const z=e.target.closest('.zone,.pool');if(z&&!e.target.closest('.chip')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();z.click();}});
    function place(c,z){if(root.dataset.locked)return;const slot=z.querySelector('.slot')||z;
      if(z.dataset.cap==='1'){const old=slot.querySelector('.chip');if(old&&old!==c){old.classList.remove('ok','err');root.querySelector('.pool .slot,.pool').append(old);}}
      slot.append(c);c.classList.remove('ok','err');root.dispatchEvent(new Event('change'));}
  }
  const chip=(text,k)=>h('button',{type:'button',class:'chip',draggable:'true','data-k':k,'aria-pressed':'false'},text);
  const zone=(label,attrs)=>h('div',Object.assign({class:'zone',tabindex:'0',role:'group','aria-label':'Ablagefeld '+label},attrs),h('span',{class:'label'},label),h('div',{class:'slot'}));

  /* ---------- Item-Renderer: gibt {el, check(), reveal(res)} zurück ---------- */
  function renderItem(item,opt={}){
    const body=h('div',{class:'ibody'});let check;
    const p=h('div',{class:'prompt'});
    if(item.type==='cloze'){
      const inputs=[];p.innerHTML=esc(item.prompt).replace(/\{\{(\d+)\}\}/g,(m,n)=>`<input class="inp" data-b="${n}" aria-label="Lücke ${n}" size="18">`);
      check=()=>{const res=item.blanks.map((b,i)=>{const v=p.querySelector(`[data-b="${i+1}"]`).value;
        return b.caseSensitive? b.accept.some(a=>a.trim()===v.trim()) : b.accept.some(a=>norm(a)===norm(v));});
        const given=[...p.querySelectorAll('input')].map(i=>i.value);return {ok:res.every(Boolean),answered:given.some(v=>v.trim()),given:given.join(' | ')};};
      body.append(p);
    }else{
      p.textContent=item.prompt;body.append(p);
      if(item.type==='single'||item.type==='multiple'){
        const multi=item.type==='multiple';const order=shuffle(item.options.map((o,i)=>i));const chosen=new Set();
        const opts=order.map(i=>{const b=h('button',{type:'button',class:'quiz-opt','aria-pressed':'false','data-i':i},item.options[i]);
          b.onclick=()=>{if(body.dataset.locked)return;if(!multi){chosen.clear();opts.forEach(o=>o.setAttribute('aria-pressed','false'));}
            chosen.has(i)?chosen.delete(i):chosen.add(i);b.setAttribute('aria-pressed',chosen.has(i));opts.forEach(o=>o.style.borderColor=o.getAttribute('aria-pressed')==='true'?'var(--bh-accent)':'');
            if(!multi&&opt.instant)opt.autoCheck&&opt.autoCheck();};return b;});
        body.append(h('div',{role:multi?'group':'radiogroup'},opts));
        check=()=>{const ans=multi?item.answer:[item.answer];const ok=ans.length===chosen.size&&ans.every(a=>chosen.has(a));
          return {ok,answered:chosen.size>0,given:[...chosen].map(i=>item.options[i]).join('; ')||'—',mark(){opts.forEach(o=>{const i=+o.dataset.i;o.style.borderColor='';
            if(ans.includes(i))o.dataset.state='ok';else if(chosen.has(i))o.dataset.state='err';});}};};
      }else if(item.type==='numeric'){
        const inp=h('input',{class:'inp',inputmode:'decimal','aria-label':'Ergebnis'});
        body.append(h('div',{class:'row'},inp,h('span',{class:'label'},item.answer.unit||'')));
        check=()=>{const v=parseNum(inp.value);return {ok:Math.abs(v-item.answer.value)<=item.answer.tolerance,answered:inp.value.trim()!=='',given:inp.value+' '+(item.answer.unit||'')};};
      }else if(item.type==='matching'){
        const w=h('div',{class:'dnd'});const pool=h('div',{class:'pool',tabindex:'0','aria-label':'Ablage: noch nicht zugeordnet'},h('div',{class:'slot'}));
        shuffle(item.pairs.map((p,i)=>i)).forEach(i=>pool.firstChild.append(chip(item.pairs[i].right,'r'+i)));
        const grid=h('div',{class:'match'});const zones=item.pairs.map((p,i)=>{const z=zone('Bedeutung hier ablegen',{'data-cap':'1','data-i':i});grid.append(h('div',{class:'left'},p.left),z);return z;});
        w.append(h('p',{class:'label'},'Ziehen oder antippen, dann Feld wählen'),pool,grid);makeDnd(w);body.append(w);
        check=()=>{let all=true,any=false;const marks=[];zones.forEach((z,i)=>{const c=z.querySelector('.chip');if(c)any=true;const ok=c&&c.dataset.k==='r'+i;if(!ok)all=false;marks.push([c,ok]);});
          return {ok:all,answered:any,given:zones.map((z,i)=>item.pairs[i].left+' → '+(z.querySelector('.chip')?.textContent||'—')).join('; '),mark(){w.dataset.locked=1;marks.forEach(([c,ok])=>c&&c.classList.add(ok?'ok':'err'));}};};
      }else if(item.type==='categorize'){
        const w=h('div',{class:'dnd'});const pool=h('div',{class:'pool',tabindex:'0','aria-label':'Ablage'},h('div',{class:'slot'}));
        shuffle(item.items.map((x,i)=>i)).forEach(i=>pool.firstChild.append(chip(item.items[i].text,'c'+i)));
        const zones=item.categories.map((c,ci)=>zone(c,{'data-ci':ci}));
        w.append(h('p',{class:'label'},'Ziehen oder antippen, dann Kategorie wählen'),pool,h('div',{class:'cats'},zones));makeDnd(w);body.append(w);
        check=()=>{const marks=[];let all=true;zones.forEach((z,ci)=>z.querySelectorAll('.chip').forEach(c=>{const ok=item.items[+c.dataset.k.slice(1)].cat===ci;if(!ok)all=false;marks.push([c,ok]);}));
          if(pool.querySelector('.chip'))all=false;return {ok:all,answered:marks.length>0,given:marks.length+' von '+item.items.length+' zugeordnet',mark(){w.dataset.locked=1;marks.forEach(([c,ok])=>c.classList.add(ok?'ok':'err'));}};};
      }else if(item.type==='ordering'){
        const ol=h('ol',{class:'ord'});let order=shuffle(item.items.map((x,i)=>i));if(order.every((v,i)=>v===i)&&order.length>1)order.reverse();
        let touched=false,dragI=null;
        const draw=()=>{ol.innerHTML='';order.forEach((i,pos)=>{const li=h('li',{},h('div',{class:'chip',draggable:'true','data-k':'o'+i},
          h('span',{},(pos+1)+'. '+item.items[i]),h('span',{},h('button',{type:'button',class:'mv','aria-label':'nach oben',onclick:()=>mv(pos,-1)},'↑'),h('button',{type:'button',class:'mv','aria-label':'nach unten',onclick:()=>mv(pos,1)},'↓'))));
          li.firstChild.addEventListener('dragstart',e=>{dragI=pos;e.dataTransfer.setData('text/plain','o'+i);});
          li.addEventListener('dragover',e=>e.preventDefault());li.addEventListener('drop',e=>{e.preventDefault();if(dragI==null)return;const[x]=order.splice(dragI,1);order.splice(pos,0,x);dragI=null;touched=true;draw();});
          ol.append(li);});};
        const mv=(pos,d)=>{if(body.dataset.locked)return;const t=pos+d;if(t<0||t>=order.length)return;[order[pos],order[t]]=[order[t],order[pos]];touched=true;draw();ol.querySelectorAll('.mv')[t*2+(d<0?0:1)]?.focus();};
        draw();body.append(h('p',{class:'label'},'Ziehen oder mit ↑ ↓ sortieren'),ol);
        check=()=>({ok:order.every((v,i)=>v===i),answered:touched,given:order.map(i=>item.items[i]).join(' → '),mark(){ol.querySelectorAll('.chip').forEach((c,pos)=>c.classList.add(order[pos]===pos?'ok':'err'));}});
      }else if(item.type==='open'){
        const ta=h('textarea',{class:'inp','aria-label':'Deine Antwort'});body.append(ta);
        check=()=>({ok:null,answered:ta.value.trim()!=='',given:ta.value});
      }
    }
    const fbBox=h('div',{'aria-live':'polite'});
    function reveal(res){body.dataset.locked=1;res.mark&&res.mark();fbBox.innerHTML='';
      const right=correctText(item);
      fbBox.append(h('div',{class:'fb '+(res.ok?'ok':'err')},h('span',{class:'label'},res.ok?'✓ Richtig':'✗ Nicht richtig'),
        !res.ok&&right?h('p',{},h('strong',{},'Lösung: '),right):null,h('p',{},item.explanation||''),
        h('span',{class:'label'},'Quelle: '+(item.source||'')+(item.slides&&item.slides.length?' · Folien '+item.slides.slice(0,6).join(', '):''))));}
    const el=h('div',{class:'item panel','data-id':item.id},h('div',{class:'qhead'},h('span',{class:'label'},(TYPE[item.type]||item.type)+' · '+chapterLabel(item.chapter)),h('span',{class:'label'},item.id)),body,fbBox);
    return {el,check:()=>check(),reveal,item};
  }
  function correctText(it){switch(it.type){
    case 'single':return it.options[it.answer];case 'multiple':return it.answer.map(i=>it.options[i]).join('; ');
    case 'numeric':return String(it.answer.value).replace('.',',')+' '+(it.answer.unit||'');
    case 'cloze':return it.blanks.map(b=>b.accept[0]).join(' | ');case 'matching':return it.pairs.map(p=>p.left+' → '+p.right).join('; ');
    case 'ordering':return it.items.join(' → ');case 'categorize':return it.categories.map((c,ci)=>c+': '+it.items.filter(x=>x.cat===ci).map(x=>x.text).join(', ')).join(' · ');}return '';}
  function chapterLabel(id){const c=USS_DATA.chapters.chapters.find(c=>c.id===id);return c?('Kap. '+c.no):'Allgemein';}

  /* Übungs-Widget mit Sofort-Feedback */
  function practiceCard(item,onDone){
    let r;const btn=h('button',{type:'button',class:'btn'},'Prüfen');
    const go=()=>{const res=r.check();if(!res.answered){btn.textContent='Bitte zuerst antworten';setTimeout(()=>btn.textContent='Prüfen',1400);return;}
      r.reveal(res);Store.record(item.id,res.ok);btn.remove();onDone&&onDone(res.ok);};
    r=renderItem(item,{instant:true,autoCheck:go});btn.onclick=go;r.el.append(h('div',{class:'row',style:'margin-top:16px'},btn));return r.el;
  }
  /* Eigenes Lernvideo (selbst gehostet): <video> mit deutscher Untertitelspur und Poster */
  function ownVideo(lid){const v=(USS_DATA.localVideos||{})[lid];if(!v)return null;
    return h('video',{controls:true,preload:'metadata',playsinline:true,poster:v.poster||null,class:'ownvideo','aria-label':'Lernvideo '+lid},
      h('source',{src:v.mp4,type:'video/mp4'}),v.vtt?h('track',{kind:'subtitles',src:v.vtt,srclang:'de',label:'Deutsch',default:true}):null);}
  const dur=s=>s?Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0'):'';
  window.UI={dnd:makeDnd,ownVideo,dur,h,esc,shuffle,renderItem,practiceCard,correctText,chapterLabel,parseNum,TYPE};
})();
