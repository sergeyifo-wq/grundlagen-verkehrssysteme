/* Test-Modus: 60-Minuten-Probeklausur (auto-bewertet oder K01–K10 mit Selbstbewertung) + Fehlerreview */
(function(){
  const D=USS_DATA,{h,shuffle}=UI,E=D.exam,F=E.format;
  const byId=Object.fromEntries(D.practice.items.map(i=>[i.id,i])),K=D['tasks-K'].tasks;
  let timer=null;
  function grade(p){const r=Math.floor(p*2)/2;const g=F.gradingScale.find(s=>r>=s.from&&r<=s.to)||F.gradingScale[0];return {points:r,grade:g.grade,gradeLabel:g.label};}
  function stop(){if(timer){clearInterval(timer);timer=null;}window.onbeforeunload=null;}
  function draw(){const pool=E.autoPool.items.map(id=>byId[id]).filter(Boolean);const out=[];
    D.chapters.chapters.forEach(c=>out.push(...shuffle(pool.filter(i=>i.chapter===c.id)).slice(0,3)));
    const rest=shuffle(pool.filter(i=>!out.includes(i)));while(out.length<30&&rest.length)out.push(rest.pop());return out;}
  function clock(sec,onEnd,el){const end=Date.now()+sec*1000;const tick=()=>{const left=Math.max(0,Math.round((end-Date.now())/1000));
      el.querySelector('.t').textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');el.classList.toggle('low',left<300);if(!left){stop();onEnd(true);}};
    tick();timer=setInterval(tick,1000);window.onbeforeunload=()=>'Probeklausur läuft';return ()=>Math.round((Date.now()-(end-sec*1000))/1000);}

  const P={};
  P.landing=()=>{stop();return [h('span',{class:'label'},`Format: ${F.durationMinutes} min · Hilfsmittel: ${F.aids} · ${F.maxPoints} Punkte · ${F.source}`),h('h1',{},'Probeklausur'),
    h('p',{class:'note'},E.mockExams[0].note),
    h('div',{class:'grid grid--2'},
      h('div',{class:'panel'},h('span',{class:'label'},'Variante A · automatisch bewertet'),h('h3',{},'30 Fragen, 60 Minuten'),h('p',{class:'note'},'Zufallsziehung aus dem Klausurpool (3 je Kapitel). Jede Frage zählt gleich, skaliert auf 100 Punkte. Danach Note und Review aller Fehler mit Erklärung.'),h('button',{type:'button',class:'btn',id:'start-auto',onclick:()=>{location.hash='#/probeklausur/auto';}},'Starten')),
      h('div',{class:'panel'},h('span',{class:'label'},'Variante B · Klausuraufgaben K01–K10'),h('h3',{},E.mockExams[0].title),h('p',{class:'note'},E.mockExams[0].timePlan+'. '+E.mockExams[0].scoring+'.'),h('button',{type:'button',class:'btn btn--ghost',onclick:()=>{location.hash='#/probeklausur/k';}},'Starten'))),
    h('section',{class:'sec'},h('span',{class:'label'},'Notenschlüssel (Folie 4)'),h('table',{class:'data'},h('tbody',{},F.gradingScale.map(g=>h('tr',{},h('td',{},`${String(g.from).replace('.',',')} – ${String(g.to).replace('.',',')} P.`),h('td',{},`${g.grade} · ${g.label}`))))),h('p',{class:'note'},F.gradingNote))];};

  P.auto=()=>{stop();const qs=draw();const rs=qs.map((q,i)=>{const r=UI.renderItem(q,{instant:false});r.el.querySelector('.qhead .label').textContent=`Frage ${i+1} / ${qs.length} · `+r.el.querySelector('.qhead .label').textContent;return r;});
    const bar=h('div',{class:'timer',role:'timer','aria-live':'off'},h('span',{},'PROBEKLAUSUR · AUTO'),h('span',{class:'t'},'60:00'),h('button',{type:'button',class:'btn',id:'submit-exam',onclick:()=>{if(confirm('Abgeben und auswerten?'))finish(false);}},'Abgeben'));
    let elapsed;function finish(timeout){stop();const res=rs.map(r=>{const x=r.check();return {id:r.item.id,chapter:r.item.chapter,ok:!!x.ok,answered:x.answered,given:x.given};});
      const n=res.filter(r=>r.ok).length;const g=grade(n/res.length*100);
      Store.state&&res.forEach(r=>Store.record(r.id,r.ok));
      Store.addTest(Object.assign({mode:'auto',date:Date.now(),seconds:elapsed(),timeout,correct:n,total:res.length,items:res},g));
      location.hash='#/ergebnis/'+(Store.state.tests.length-1);}
    setTimeout(()=>{elapsed=clock(F.durationMinutes*60,finish,bar);},0);
    return [bar,h('p',{class:'note'},'Kein Sofort-Feedback während der Klausur. Bei 00:00 wird automatisch abgegeben.'),rs.map(r=>r.el),h('div',{class:'row'},h('button',{type:'button',class:'btn',onclick:()=>bar.querySelector('button').click()},'Abgeben'))];};

  P.k=()=>{stop();const bar=h('div',{class:'timer',role:'timer'},h('span',{},'PROBEKLAUSUR · K01–K10'),h('span',{class:'t'},'60:00'),h('button',{type:'button',class:'btn',onclick:()=>done(false)},'Abgeben'));
    const tas=K.map(t=>h('textarea',{class:'inp','aria-label':'Antwort '+t.id}));
    const wrap=h('div',{},K.map((t,i)=>h('div',{class:'item panel'},h('div',{class:'qhead'},h('span',{class:'label'},`${t.id} · ${t.points} P. · ca. ${t.minutes} min`)),h('div',{class:'prompt'},t.prompt),tas[i])));
    let elapsed;setTimeout(()=>{elapsed=clock(F.durationMinutes*60,done,bar);},0);
    function done(timeout){stop();const secs=elapsed();bar.remove();wrap.innerHTML='';
      const ins=K.map(t=>h('input',{class:'inp',type:'number',min:0,max:t.points,step:0.5,value:0,'aria-label':'Punkte '+t.id,style:'width:90px'}));
      wrap.append(h('div',{class:'gap'},h('span',{class:'label'},'Selbstbewertung'),h('p',{},'Vergleiche deine Antwort mit dem Bewertungsschema und trage die Punkte ein.')),
        ...K.map((t,i)=>h('div',{class:'item panel'},h('span',{class:'label'},t.id),h('div',{class:'prompt'},t.prompt),h('p',{class:'label'},'Deine Antwort'),h('p',{},tas[i].value||'—'),h('div',{class:'solution',html:t.solutionHtml}),h('div',{class:'row',style:'margin-top:12px'},h('span',{class:'label'},`Punkte (max. ${t.points})`),ins[i]))),
        h('button',{type:'button',class:'btn',onclick:()=>{const items=K.map((t,i)=>{const p=Math.min(t.points,Math.max(0,UI.parseNum(ins[i].value)||0));return {id:t.id,points:p,max:t.points,ok:p>=t.points,given:tas[i].value};});
          const g=grade(items.reduce((a,b)=>a+b.points,0));Store.addTest(Object.assign({mode:'k',date:Date.now(),seconds:secs,timeout,items},g));location.hash='#/ergebnis/'+(Store.state.tests.length-1);}},'Auswerten'));}
    return [bar,wrap];};

  P.result=(n)=>{stop();const t=Store.state.tests[+n];if(!t)return [h('h1',{},'Kein Ergebnis'),h('a',{href:'#/probeklausur'},'Zur Probeklausur')];
    const head=[h('span',{class:'label'},`Ergebnis · ${new Date(t.date).toLocaleString('de-AT')} · ${Math.floor(t.seconds/60)} min ${t.seconds%60} s${t.timeout?' · Zeit abgelaufen':''}`),h('h1',{},'Auswertung'),
      h('div',{class:'grid'},h('div',{class:'panel'},h('span',{class:'label'},'Punkte'),h('div',{class:'big',id:'score'},String(t.points).replace('.',',')),h('p',{class:'note'},'von 100')),
        h('div',{class:'panel'},h('span',{class:'label'},'Note'),h('div',{class:'big'},String(t.grade)),h('p',{class:'note'},t.gradeLabel)),
        t.mode==='auto'?h('div',{class:'panel'},h('span',{class:'label'},'Richtig'),h('div',{class:'big'},`${t.correct}/${t.total}`)):null)];
    if(t.mode==='k')return [...head,h('table',{class:'data'},h('tbody',{},t.items.map(i=>h('tr',{},h('td',{},i.id),h('td',{},`${i.points} / ${i.max} P.`))))),h('p',{class:'note'},F.gradingNote)];
    const per=D.chapters.chapters.map(c=>{const xs=t.items.filter(i=>i.chapter===c.id);return [c,xs.filter(i=>i.ok).length,xs.length];}).filter(x=>x[2]);
    const wrong=t.items.filter(i=>!i.ok);
    return [...head,h('section',{class:'sec'},h('span',{class:'label'},'Nach Kapitel'),h('table',{class:'data'},h('tbody',{},per.map(([c,o,a])=>h('tr',{},h('td',{},`${c.no}. ${c.title}`),h('td',{},`${o}/${a}`),h('td',{},o<a?h('a',{href:'#/kapitel/'+c.id},'Wiederholen'):'✓')))))),
      h('section',{class:'sec',id:'review'},h('span',{class:'label'},`Fehlerreview · ${wrong.length} Fehler`),h('h2',{},'Was war falsch?'),
        wrong.map(w=>{const it=byId[w.id];return h('div',{class:'item panel'},h('div',{class:'qhead'},h('span',{class:'label'},UI.TYPE[it.type]+' · '+UI.chapterLabel(it.chapter)),h('span',{class:'label'},it.id)),
          h('div',{class:'prompt'},it.type==='cloze'?it.prompt.replace(/\{\{\d+\}\}/g,'____'):it.prompt),
          h('div',{class:'fb err'},h('span',{class:'label'},w.answered?'Deine Antwort':'Nicht beantwortet'),w.answered?h('p',{},w.given):null,h('p',{},h('strong',{},'Richtig: '),UI.correctText(it)),h('p',{},it.explanation||''),h('span',{class:'label'},'Quelle: '+it.source)));}),
        h('div',{class:'row'},h('a',{class:'btn',href:'#/fehler'},'Fehler gezielt üben'),h('a',{class:'btn btn--ghost',href:'#/probeklausur'},'Neue Probeklausur')))];};
  window.Exam=Object.assign(P,{stop});
})();
