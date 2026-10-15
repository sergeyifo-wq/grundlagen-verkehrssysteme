/* Seite „Interaktiv“: fünf Werkzeuge. Alle Fakten/Zahlen werden zur Laufzeit aus content/ gelesen (siehe Quelle unter jedem Werkzeug). */
(function(){
  const D=USS_DATA,{h,shuffle}=UI;
  const L=Object.fromEntries(D.lessons.lessons.map(l=>[l.id,l])),PI=Object.fromEntries(D.practice.items.map(i=>[i.id,i]));
  const fb=(ok,text)=>h('div',{class:'fb '+(ok?'ok':'err'),'aria-live':'polite'},h('span',{class:'label'},ok?'✓ Richtig':'✗ Noch nicht'),h('p',{},text));
  const src=t=>h('p',{class:'label ia-src'},'Quelle: '+t);
  const fmt=(v,d=1)=>v.toLocaleString('de-AT',{minimumFractionDigits:d,maximumFractionDigits:d});
  function tableFrom(lessonId,captionStart){const div=document.createElement('div');div.innerHTML=L[lessonId].html;
    const t=[...div.querySelectorAll('table')].find(t=>(t.caption?.textContent||'').startsWith(captionStart));if(!t)return null;
    return {head:[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()),rows:[...t.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.trim()))};}
  const tool=(id,no,title,intro,...body)=>h('section',{class:'sec ia',id},h('span',{class:'label'},`Werkzeug ${no} / 5`),h('h2',{},title),h('p',{class:'note'},intro),...body);

  /* 1 Transportketten-Baukasten (Ordering-Items aus practice.json, v. a. or-01) */
  function chain(){const items=D.practice.items.filter(i=>i.type==='ordering');let cur=items.find(i=>i.id==='or-01')||items[0];
    const wrap=h('div',{});const sel=h('select',{class:'inp','aria-label':'Ablauf wählen',onchange:e=>{cur=PI[e.target.value];draw();}},items.map(i=>h('option',{value:i.id,selected:i===cur},i.prompt)));
    function draw(){wrap.innerHTML='';const w=h('div',{class:'dnd'});
      const pool=h('div',{class:'pool',tabindex:'0','aria-label':'Bausteine'},h('div',{class:'slot'}));
      shuffle(cur.items.map((x,i)=>i)).forEach(i=>pool.firstChild.append(h('button',{type:'button',class:'chip',draggable:'true','data-k':'s'+i,'aria-pressed':'false'},cur.items[i])));
      const slots=cur.items.map((x,i)=>h('div',{class:'zone ia-slot',tabindex:'0','data-cap':'1','data-i':i,role:'group','aria-label':'Station '+(i+1)},h('span',{class:'label'},'Station '+(i+1)),h('div',{class:'slot'})));
      const out=h('div',{});
      const btn=h('button',{type:'button',class:'btn',onclick:()=>{const ok=slots.every((z,i)=>z.querySelector('.chip')?.dataset.k==='s'+i);
        slots.forEach((z,i)=>{const c=z.querySelector('.chip');if(c)c.classList.add(c.dataset.k==='s'+i?'ok':'err');});
        Store.record('ia-kette-'+cur.id,ok);out.innerHTML='';out.append(fb(ok,ok?cur.explanation:'Grün = richtige Station, Rot = falsch. Richtig: '+cur.items.join(' → ')));}},'Kette prüfen');
      const reset=h('button',{type:'button',class:'btn btn--ghost',onclick:draw},'Neu mischen');
      w.append(h('p',{class:'label'},'Baustein ziehen oder antippen, dann Station wählen'),pool,h('div',{class:'ia-chain'},slots));UI.dnd(w);
      // Jede Änderung der Kette setzt Prüfstatus und Feedback zurück
      w.addEventListener('change',()=>{w.querySelectorAll('.chip.ok,.chip.err').forEach(c=>c.classList.remove('ok','err'));out.innerHTML='';});
      wrap.append(w,h('div',{class:'row',style:'margin-top:12px'},btn,reset),out,src(cur.source+' · Übungs-Item '+cur.id));}
    draw();return tool('ia-kette',1,'Transportketten-Baukasten','Baue die Kette Station für Station. Die Bausteine stammen aus den Reihenfolge-Aufgaben des Kurses.',h('label',{class:'label'},'Ablauf ',sel),wrap);}

  /* 2 Modal-Split-Rechner (Formel + Zahlen aus nu-08 und Abb. „modalshift“ des Buchs) */
  function modal(){const it=PI['nu-08'];const m=(it?.prompt||'').match(/Straße (\d+), Schiene (\d+), Binnenschiff (\d+)/);
    const presets=[];if(m)presets.push({name:'Rechenbeispiel nu-08',v:[+m[1],+m[2],+m[3]],src:'Übungs-Item nu-08 (Lehrbeispiel)'});
    presets.push({name:'Buch-Abb. Modal Shift: vorher',v:[70,30,0],src:'Buch v3 Kap. 5.5, Abb. „Absolut mehr Schiene ≠ höherer Anteil“'},{name:'Buch-Abb. Modal Shift: nachher',v:[84,33,0],src:'Buch v3 Kap. 5.5, gleiche Abb.'});
    const names=['Straße','Schiene','Binnenschiff'];let v=presets[0].v.slice();const base={v:null};
    const sl=names.map((n,i)=>h('input',{type:'range',min:0,max:500,step:1,value:v[i],'aria-label':n+' in Mrd. tkm',oninput:e=>{v[i]=+e.target.value;upd();}}));
    const outs=names.map(()=>h('span',{class:'ia-val'}));const bars=h('div',{class:'ia-stack'});const res=h('div',{});const chal=h('div',{});
    function upd(){const s=v.reduce((a,b)=>a+b,0);sl.forEach((x,i)=>{x.value=v[i];outs[i].textContent=`${v[i]} · ${s?fmt(v[i]/s*100):'–'} %`;});
      bars.innerHTML='';names.forEach((n,i)=>bars.append(h('i',{style:`width:${s?v[i]/s*100:0}%`,class:'c'+i,title:n})));
      res.innerHTML='';res.append(h('p',{class:'ia-formula'},`Anteil Schiene = ${v[1]} / ${s} × 100 % = ${s?fmt(v[1]/s*100):'–'} %`));
      if(base.v){const s0=base.v.reduce((a,b)=>a+b,0),a0=s0?base.v[1]/s0:null,a1=s?v[1]/s:null;const ok=a0!==null&&a1!==null&&v[1]>base.v[1]&&a1<a0;
        const pc=x=>x===null?'–':fmt(x*100);  // Summe 0 → kein Anteil definiert
        chal.innerHTML='';chal.append(fb(ok,ok?`Schiene absolut +${v[1]-base.v[1]}, Anteil trotzdem ${pc(a0)} % → ${pc(a1)} %: genau der Effekt aus der Buch-Abbildung.`:`Schiene muss absolut steigen (jetzt ${v[1]} vs. ${base.v[1]}), ihr Anteil aber sinken (jetzt ${pc(a1)} % vs. ${pc(a0)} %).${a1===null||a0===null?' Bei Summe 0 ist kein Anteil definiert.':''}`));
        if(ok&&!base.done){base.done=1;Store.record('ia-modalsplit',true);}}}
    const pre=h('div',{class:'filters'},presets.map(p=>h('button',{type:'button',onclick:()=>{v=p.v.slice();upd();}},p.name)));
    const start=h('button',{type:'button',class:'btn',onclick:()=>{base.v=v.slice();base.done=0;upd();}},'Aufgabe starten: Schiene absolut erhöhen, Anteil senken');
    upd();
    return tool('ia-modal',2,'Modal-Split-Rechner','Verschiebe die Verkehrsleistung je Träger (Mrd. tkm). Der Anteil hängt immer am Nenner: gleiche Messgröße, gleiche Systemgrenze.',
      pre,h('div',{class:'ia-sliders'},names.map((n,i)=>h('label',{class:'ia-sl'},h('span',{class:'label'},n),sl[i],outs[i]))),bars,res,start,chal,
      src(`Formel: ${it?it.explanation.split('.')[0]:'Buch v3 Kap. 4/15'} · Voreinstellungen: ${presets.map(p=>p.src).join('; ')}`));}

  /* 3 Netz-Simulator Raster / Hub-and-Spoke / Tour (Formeln aus Lektion k02-l03, Beschreibung k02-l02) */
  function net(){let n=6,mode='raster',dir=false;const svgBox=h('div',{class:'ia-net'});const info=h('div',{});const q=h('div',{});
    const NS='http://www.w3.org/2000/svg';
    function draw(){const W=360,H=260,cx=180,cy=130,r=100;const pts=[...Array(n)].map((_,i)=>[cx+r*Math.cos(2*Math.PI*i/n-Math.PI/2),cy+r*Math.sin(2*Math.PI*i/n-Math.PI/2)]);
      let s=`<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Netz ${mode} mit ${n} Knoten">`;const ln=(a,b,c='#9AA0A4',w=1.2)=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}"/>`;
      if(mode==='raster')for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)s+=ln(pts[i],pts[j]);
      if(mode==='hub')for(let i=1;i<n;i++)s+=ln(pts[i],pts[0],'#FF6200',1.6);
      if(mode==='tour'){for(let i=0;i<n;i++)s+=ln(pts[i],pts[(i+1)%n],'#FF6200',1.8);}
      pts.forEach((p,i)=>{const hub=(mode==='hub'&&i===0)||(mode==='tour'&&i===0);s+=hub?`<rect x="${p[0]-9}" y="${p[1]-9}" width="18" height="18" fill="#FF6200"/>`:`<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#242424" stroke="#F1F0EA" stroke-width="1.3"/>`;});
      svgBox.innerHTML=s+'</svg>';
      const k=mode==='raster'?(dir?n*(n-1):n*(n-1)/2):mode==='hub'?(dir?2*(n-1):n-1):null;
      info.innerHTML='';info.append(h('p',{class:'ia-formula'},mode==='raster'?`Raster: n × (n − 1)${dir?'':' / 2'} = ${n} × ${n-1}${dir?'':' / 2'} = ${k} ${dir?'gerichtete Relationen':'Kanten'}`:
        mode==='hub'?`Hub-and-Spoke: ${dir?'2 × (n − 1)':'n − 1'} = ${k} ${dir?'gerichtete Relationen':'Kanten'} (Hub ist einer der ${n} Knoten)`:'Tour: ein Fahrzeug bedient die Halte nacheinander (Sammel-/Verteiltour, Milk Run).'),
        h('p',{class:'note'},mode==='raster'?'Kurze direkte Wege, kein zentraler Umschlag; mit wachsender Knotenzahl steigt die Zahl der Relationen stark, schwache Einzelströme bleiben schlecht ausgelastet.':
          mode==='hub'?'Bündelung am Hub erlaubt größere Verkehre, erzeugt aber Umwege, Umstiege und Abhängigkeit vom zentralen Knoten. Verkehr zwischen zwei Außenknoten läuft über zwei Kanten.':
          'Vorteil geringerer Fahrzeugzahl gegen zusätzliche Fahrstrecke und Zeitfenster der Kunden. Klausurfalle: mehrere Halte machen eine Tour nicht multimodal.'));
      ask();}
    function ask(){q.innerHTML='';if(mode==='tour')return;const m2=3+Math.floor(Math.random()*8);const right=mode==='raster'?(dir?m2*(m2-1):m2*(m2-1)/2):(dir?2*(m2-1):m2-1);
      const inp=h('input',{class:'inp',inputmode:'numeric','aria-label':'Anzahl',size:6});const out=h('div',{});
      q.append(h('p',{},`Kontrollfrage: Wie viele ${dir?'gerichtete Relationen':'Kanten'} hat ein ${mode==='raster'?'vollständiges Raster':'Hub-and-Spoke-Netz'} mit ${m2} Knoten?`),
        h('div',{class:'row'},inp,h('button',{type:'button',class:'btn',onclick:()=>{out.innerHTML='';if(!inp.value.trim()){out.append(h('p',{class:'ia-hint label',role:'status'},'Bitte zuerst eine Zahl eingeben – leere Antworten zählen nicht.'));inp.focus();return;}const ok=UI.parseNum(inp.value)===right;Store.record('ia-netz-'+mode+(dir?'-g':''),ok);out.innerHTML='';out.append(fb(ok,`${right} – ${mode==='raster'?(dir?'n × (n − 1)':'n × (n − 1) / 2'):(dir?'2 × (n − 1)':'n − 1')} mit n = ${m2}.`));}},'Prüfen'),h('button',{type:'button',class:'btn btn--ghost',onclick:ask},'Neue Frage')),out);}
    const nIn=h('input',{type:'range',min:3,max:12,value:n,'aria-label':'Knotenzahl',oninput:e=>{n=+e.target.value;nl.textContent='n = '+n;draw();}});const nl=h('span',{class:'ia-val'},'n = '+n);
    const modes=h('div',{class:'filters',role:'group','aria-label':'Netzform'},[['raster','Raster'],['hub','Hub-and-Spoke'],['tour','Tour']].map(([k,t])=>h('button',{type:'button','aria-pressed':k===mode,onclick:e=>{mode=k;modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===e.target));draw();}},t)));
    const dirBox=h('label',{class:'label'},h('input',{type:'checkbox',onchange:e=>{dir=e.target.checked;draw();}}),' gerichtete Relationen');
    draw();return tool('ia-netz',3,'Netz-Simulator: Raster, Hub-and-Spoke, Tour','Ändere die Knotenzahl und die Netzform. Die Zahl der Verbindungen folgt den Formeln aus Lektion 2.3.',
      h('div',{class:'ia-netgrid'},h('div',{},modes,h('label',{class:'ia-sl'},h('span',{class:'label'},'Knoten'),nIn,nl),dirBox,info,q),svgBox),
      src('Lektion 2.3 „Rastersystem und Hub-and-Spoke“ (Formeln, Vor-/Nachteile); Lektion 2.2 „Direktverkehr, Tourenverkehr und Systemverkehr“'));}

  /* 4 Verkehrsträger-Wahl: Karten aus der Vergleichstabelle in Lektion k03-l02 */
  function choice(){const T=tableFrom('k03-l02','Die vier Verkehrsträger');if(!T)return null;const carriers=T.head.slice(1);
    let deck=shuffle(T.rows.flatMap(r=>r.slice(1).map((c,i)=>({crit:r[0],text:c,ans:i})))),pos=0,score=0;const box=h('div',{});
    function show(){box.innerHTML='';if(pos>=deck.length){Store.record('ia-wahl',score===deck.length);box.append(h('div',{class:'panel'},h('span',{class:'label'},'Runde beendet'),h('div',{class:'big'},`${score}/${deck.length}`),h('button',{type:'button',class:'btn',onclick:()=>{deck=shuffle(deck);pos=0;score=0;show();}},'Neue Runde')));return;}
      const c=deck[pos];const out=h('div',{});
      const opts=carriers.map((n,i)=>h('button',{type:'button',class:'quiz-opt',onclick:()=>{if(out.childNodes.length)return;const ok=i===c.ans;if(ok)score++;Store.record('ia-wahl-'+c.crit+'-'+c.ans,ok);
        opts.forEach((o,k)=>{if(k===c.ans)o.dataset.state='ok';else if(k===i)o.dataset.state='err';});
        out.append(fb(ok,`„${c.text}“ gehört bei „${c.crit}“ zu ${carriers[c.ans]}.`),h('button',{type:'button',class:'btn',style:'margin-top:12px',onclick:()=>{pos++;show();}},pos+1<deck.length?'Nächste Karte':'Auswertung'));out.querySelector('.btn').focus();}},n));
      box.append(h('div',{class:'panel'},h('span',{class:'label'},`Karte ${pos+1} / ${deck.length} · Punkte ${score} · Kriterium: ${c.crit}`),h('p',{class:'ia-card'},c.text),h('p',{class:'label'},'Welcher Verkehrsträger?'),h('div',{class:'ia-opts'},opts),out));}
    show();return tool('ia-wahl',4,'Entscheidungsspiel: Welcher Verkehrsträger passt?','Jede Karte ist eine Zelle der Vergleichstabelle (Netz, Vorteil, Grenze, günstiger Fall, Bedingung). Ordne sie dem Träger zu. Merke: Das Urteil braucht immer Bedingungen.',box,
      src('Lektion 3.2 „Vier Verkehrsträger vergleichbar machen“, Tabelle „Die vier Verkehrsträger im Vergleich“'));}

  /* 5 Zeitleiste sortieren + Mechanismus zuordnen (Tabelle in Lektion k01-l04) */
  function timeline(){const T=tableFrom('k01-l04','Entwicklungen der Verkehrswirtschaft');if(!T)return null;
    const box=h('div',{});
    function draw(){box.innerHTML='';const it={id:'ia-zeit',type:'ordering',chapter:'k01',prompt:'Bringe die Entwicklungen in die Reihenfolge der Tabelle (früh → heute).',items:T.rows.map(r=>r[0]),
        explanation:T.rows.map(r=>`${r[0]}: ${r[1]} → ${r[2]}`).join(' · '),source:'Lektion 1.4, Tabelle „Entwicklungen der Verkehrswirtschaft“'};
      box.append(UI.practiceCard(it));
      const m={id:'ia-zeit-mech',type:'matching',chapter:'k01',prompt:'Ordne jeder Entwicklung ihren Mechanismus zu.',pairs:T.rows.map(r=>({left:r[0],right:r[1]})),explanation:'Erklärt wird über den Mechanismus, nicht über eine Jahreszahl.',source:'Lektion 1.4'};
      box.append(UI.practiceCard(m));}
    draw();return tool('ia-zeit',5,'Zeitleiste: Entwicklung der Verkehrswirtschaft','Sortiere die Entwicklungsschritte und ordne die Mechanismen zu. Jahreszahlen nennt der Kurs bewusst nicht.',box,h('button',{type:'button',class:'btn btn--ghost',onclick:draw},'Neu mischen'),
      src('Lektion 1.4 „Entwicklung der Verkehrswirtschaft“, Tabelle „Entwicklungen der Verkehrswirtschaft: Mechanismus und mögliche Folge“'));}

  Pages.interactive=()=>[h('span',{class:'label'},'Interaktiv · nur Kursinhalte · Fortschritt in uss.v1'),h('h1',{},'Interaktiv'),
    h('nav',{class:'filters','aria-label':'Werkzeuge'},[['ia-kette','Transportkette'],['ia-modal','Modal Split'],['ia-netz','Netz-Simulator'],['ia-wahl','Verkehrsträger-Wahl'],['ia-zeit','Zeitleiste']].map(([id,t])=>h('a',{href:'#/interaktiv#'+id,class:'ia-jump'},t))),
    chain(),modal(),net(),choice(),timeline()].filter(Boolean);
})();
