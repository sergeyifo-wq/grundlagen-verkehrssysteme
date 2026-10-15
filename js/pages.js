/* Seiten (datengetrieben aus window.USS_DATA) */
(function(){
  const D=USS_DATA,{h,esc,shuffle}=UI;
  const CH=D.chapters.chapters, LS=D.lessons.lessons, byId=Object.fromEntries(LS.map(l=>[l.id,l]));
  const chap=id=>CH.find(c=>c.id===id);
  const items=D.practice.items, cards=D.flashcards.cards, LV=D.localVideos||{};
  const P={};
  const pct=(a,b)=>b?Math.round(100*a/b):0;
  function chapStats(c){const ls=c.lessons.length,done=c.lessons.filter(Store.isLessonDone).length;
    const its=items.filter(i=>i.chapter===c.id),ok=its.filter(i=>(Store.item(i.id)||{}).correct>0).length;
    const fc=cards.filter(x=>x.chapter===c.id),due=fc.filter(x=>Store.item(x.id)&&Store.isDue(x.id)).length;
    return {ls,done,its:its.length,ok,fc:fc.length,due};}
  const bar=v=>h('div',{class:'bar',role:'progressbar','aria-valuenow':v,'aria-valuemin':0,'aria-valuemax':100},h('i',{style:`width:${v}%`}));
  const dueCards=()=>cards.filter(c=>Store.item(c.id)&&Store.isDue(c.id));
  const newCards=()=>cards.filter(c=>!Store.item(c.id));

  P.home=()=>{const c=D.course,next=c.schedule.find(s=>s.date>=new Date().toISOString().slice(0,10));
    const allL=LS.length,doneL=LS.filter(l=>Store.isLessonDone(l.id)).length;
    return [h('section',{class:'hero'},h('span',{class:'label'},`${c.term} · ${c.group} · ${c.ects} ECTS · ${c.lecturer}`),
      h('h1',{},c.title),h('p',{},'Komplette Klausurvorbereitung: 10 Kapitel mit Lektionen, Karteikarten mit Wiederholungsplan, Drag-and-drop- und Rechenübungen mit Sofort-Feedback, Lerntraining A01–A30 und eine 60-Minuten-Probeklausur mit Fehleranalyse.'),
      h('div',{class:'row',style:'margin-top:24px'},h('a',{class:'btn',href:'#/kapitel'},'Lernen starten'),h('a',{class:'btn btn--ghost',href:'#/karteikarten'},`Wiederholen (${dueCards().length} fällig)`),h('a',{class:'btn btn--ghost',href:'#/probeklausur'},'Probeklausur'))),
      h('div',{class:'marquee','aria-hidden':'true'},h('div',{},...[...CH,...CH].map(c=>h('span',{},`■ KAP. ${String(c.no).padStart(2,'0')} ${c.title}`)))),
      h('div',{class:'grid'},
        h('div',{class:'panel'},h('span',{class:'label'},'Lektionen gelesen'),h('div',{class:'num'},`${doneL}/${allL}`),bar(pct(doneL,allL))),
        h('div',{class:'panel'},h('span',{class:'label'},'Karteikarten fällig'),h('div',{class:'num'},String(dueCards().length)),h('p',{class:'note'},`${newCards().length} noch neu`)),
        h('div',{class:'panel'},h('span',{class:'label'},'Nächster Termin'),next?[h('div',{class:'num',style:'font-size:32px'},next.date.split('-').reverse().join('.')),h('p',{class:'note'},`${next.time} · ${next.room} · ${next.topic}`)]:h('p',{},'—'),h('p',{class:'label'},c.scheduleNote))),
      h('section',{class:'sec'},h('span',{class:'label'},'Lernziele (Folie 5)'),h('ol',{},c.learningGoals.map(g=>h('li',{},typeof g==='string'?g:(g.text||g.goal||JSON.stringify(g)))))),
      h('section',{class:'sec'},h('span',{class:'label'},'Kapitel'),h('div',{class:'grid'},CH.map(chapCard))),
      h('section',{class:'sec'},h('span',{class:'label'},'Pflichtliteratur'),h('p',{},c.literature.citation),h('p',{class:'note'},(c.literature.required||[]).join(' · ')))];};
  function chapCard(c){const s=chapStats(c);return h('a',{class:'card',href:'#/kapitel/'+c.id},h('span',{class:'label'},`Kapitel ${String(c.no).padStart(2,'0')} / ${CH.length}`),h('h3',{},c.title),h('p',{},`${s.ls} Lektionen · ${s.its} Übungen`),bar(pct(s.done,s.ls)));}
  P.chapters=()=>[h('h1',{},'Kapitel'),h('div',{class:'grid'},CH.map(chapCard))];
  P.chapter=(id)=>{const c=chap(id);if(!c)return P.notfound();const s=D.summaries.summaries.find(x=>x.chapter===id),st=chapStats(c);
    const v=c.lessons.filter(x=>LV[x]);
    return [h('span',{class:'label'},`Kapitel ${String(c.no).padStart(2,'0')} / ${CH.length} · Status: ${st.done===st.ls?'abgeschlossen':st.done?'in Arbeit':'offen'}`),h('h1',{style:'font-size:56px'},c.title),
      h('p',{style:'max-width:760px'},c.intro),h('div',{class:'gap',style:'border-color:var(--bh-accent)'},h('span',{class:'label'},'Leitfrage'),h('p',{},c.guidingQuestion)),
      h('div',{class:'panel'},h('span',{class:'label'},'Lernziele'),h('p',{},c.goals)),
      h('section',{class:'sec'},h('span',{class:'label'},'Lektionen'),h('div',{class:'grid'},c.lessons.map((lid,i)=>{const l=byId[lid];
        return h('a',{class:'card',href:'#/lektion/'+lid},h('span',{class:'label'},`${c.no}.${i+1} ${Store.isLessonDone(lid)?'· ✓ gelesen':''}`),h('h3',{},l.title));}))),
      h('section',{class:'sec row'},h('a',{class:'btn',href:'#/ueben/'+id},`Üben (${st.its})`),h('a',{class:'btn btn--ghost',href:'#/karteikarten/'+id},`Karteikarten (${st.fc})`),h('a',{class:'btn btn--ghost',href:'#/zusammenfassungen#'+id},'Zusammenfassung'),
        s&&s.trainingTasks.length?h('a',{class:'btn btn--ghost',href:'#/aufgaben/'+id},'Lerntraining '+s.trainingTasks.join(', ')):null),
      v.length?h('section',{class:'sec'},h('span',{class:'label'},`Lernvideos zum Kapitel · ${v.length}`),h('div',{class:'grid'},v.map(x=>vidCard(x)))):null];};

  P.lesson=(id)=>{const l=byId[id];if(!l)return P.notfound();const c=chap(l.chapter),i=c.lessons.indexOf(id);
    const all=LS.map(x=>x.id),gi=all.indexOf(id),prev=all[gi-1],next=all[gi+1];
    const art=h('article',{class:'reading'});
    art.append(h('span',{class:'label',style:'color:var(--bh-ink-2)'},`Kapitel ${c.no}.${i+1} · ${c.title}`),h('h2',{},l.title));
    const content=h('div',{html:l.html});
    content.querySelectorAll('a.xref').forEach(a=>{if(/^#\//.test(a.getAttribute('href')||''))return;a.replaceWith(h('span',{class:'ref'},a.textContent||''));}); // nur interne Lektionslinks behalten
    content.querySelectorAll('table').forEach(t=>{const hs=[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());if(!hs.length)return;t.classList.add('stack');t.querySelectorAll('tbody tr').forEach(tr=>[...tr.children].forEach((td,i)=>hs[i]&&td.setAttribute('data-l',hs[i])));});
    content.querySelectorAll('.box').forEach(b=>{if(/Prüfhinweis/i.test(b.querySelector('.lab')?.textContent||''))b.classList.add('pruef');});
    art.append(content);
    l.figures.forEach(f=>art.append(h('figure',{},h('img',{src:'figs/'+f.key+'.svg',alt:f.caption,loading:'lazy'}),h('figcaption',{},'Abb. · '+f.caption))));
    D['worked-examples'].examples.filter(e=>e.lesson===id&&!l.html.includes(e.text.slice(0,40))).forEach(e=>art.append(h('div',{class:'box bsp'},h('div',{class:'lab'},'Beispiel: '+e.title),h('p',{},e.text))));
    const ov=UI.ownVideo(id);
    if(ov)art.insertBefore(h('section',{class:'lvideo'},h('span',{class:'label'},`Lernvideo zur Lektion · ${UI.dur(LV[id].duration)} · Untertitel Deutsch`),ov),art.children[2]||null);
    const s=l.sources||{};art.append(h('p',{class:'srcline'},'QUELLEN · Buch v3 S. '+(s.book?.originalPage??'–')+(s.book?.note?' · '+s.book.note:'')+(s.slides?.length?' · Folien '+s.slides.join(', '):'')+(s.kummer?.length?' · Kummer S. '+s.kummer.map(k=>k.page??k).join(', '):'')));
    const items_=items.filter(x=>x.chapter===l.chapter&&(x.slides||[]).some(sl=>(s.slides||[]).includes(sl))).slice(0,2);
    const quick=items_.length?h('section',{class:'sec'},h('span',{class:'label'},'Kurz prüfen'),items_.map(x=>UI.practiceCard(x))):null;
    const doneBtn=h('button',{type:'button',class:'btn',onclick:()=>{Store.lessonDone(id);doneBtn.textContent='✓ Als gelesen markiert';}},Store.isLessonDone(id)?'✓ Als gelesen markiert':'Als gelesen markieren');
    const toc=h('details',{class:'tocwrap',open:window.matchMedia('(min-width:901px)').matches},h('summary',{class:'label'},`Kapitel ${c.no} · Lektion ${i+1} / ${c.lessons.length} · Übersicht`),h('nav',{class:'toc','aria-label':'Lektionen dieses Kapitels'},h('a',{href:'#/kapitel/'+c.id},'← Kapitel '+c.no),c.lessons.map((x,k)=>h('a',{href:'#/lektion/'+x,'aria-current':x===id?'page':null},`${c.no}.${k+1} ${byId[x].title}`))));
    return [h('div',{class:'lesson'},toc,h('div',{},art,quick,h('div',{class:'pager'},prev?h('a',{class:'btn btn--ghost',href:'#/lektion/'+prev},'← '+byId[prev].title):h('span'),doneBtn,next?h('a',{class:'btn btn--ghost',href:'#/lektion/'+next},byId[next].title+' →'):h('a',{class:'btn btn--ghost',href:'#/probeklausur'},'Zur Probeklausur →'))))];};

  /* Karteikarten mit Spaced Repetition */
  P.flashcards=(cid)=>{const pool=cards.filter(c=>!cid||c.chapter===cid);
    let queue=[...pool.filter(c=>Store.item(c.id)&&Store.isDue(c.id)),...shuffle(pool.filter(c=>!Store.item(c.id)))];let mode='Fällig + neu';
    const wrap=h('div',{class:'flash'});
    const filt=h('div',{class:'filters'},h('button',{type:'button','aria-pressed':!cid,onclick:()=>location.hash='#/karteikarten'},'Alle'),CH.map(c=>h('button',{type:'button','aria-pressed':cid===c.id,onclick:()=>location.hash='#/karteikarten/'+c.id},'Kap. '+c.no)));
    function show(){wrap.innerHTML='';
      if(!queue.length){wrap.append(h('div',{class:'panel'},h('span',{class:'label'},'Sitzung beendet'),h('h3',{},'Keine fälligen Karten.'),h('p',{class:'note'},'Die nächsten Karten werden nach Plan wieder fällig.'),
        h('button',{type:'button',class:'btn',onclick:()=>{queue=shuffle(pool);mode='Freies Üben';show();}},'Alle Karten trotzdem üben')));return;}
      const c=queue[0];let flipped=false;
      const fc=h('div',{class:'panel fc',tabindex:'0',role:'button','aria-label':'Karte umdrehen'},h('span',{class:'label'},UI.chapterLabel(c.chapter)+' · Vorderseite'),h('div',{class:'face'},c.front));
      const rate=h('div',{class:'rate',hidden:true},[[1,'Nochmal'],[3,'Schwer'],[4,'Gut'],[5,'Leicht']].map(([q,t])=>h('button',{type:'button',class:q===1?'btn btn--ghost':'btn',onclick:()=>{Store.rate(c.id,q);queue.shift();if(q===1)queue.splice(Math.min(3,queue.length),0,c);show();}},t)));
      const flip=()=>{if(flipped)return;flipped=true;fc.classList.add('flipped');fc.innerHTML='';fc.append(h('span',{class:'label'},c.front),h('div',{class:'back'},c.back),h('span',{class:'label'},'Quelle: '+c.source));rate.hidden=false;rate.querySelector('.btn:not(.btn--ghost)').focus();};
      fc.onclick=flip;fc.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip();}};
      wrap.append(h('p',{class:'label'},`${mode} · noch ${queue.length} Karten`),fc,h('div',{class:'row',style:'margin-top:16px'},h('button',{type:'button',class:'btn btn--ghost',onclick:flip},'Umdrehen')),rate);}
    show();return [h('span',{class:'label'},'Spaced Repetition (SM-2, vereinfacht)'),h('h1',{},'Karteikarten'),h('p',{class:'note'},'Fällige Karten zuerst, dann neue. „Nochmal“ zeigt die Karte in derselben Sitzung erneut; sonst wächst der Abstand (1 → 3 → … Tage).'),filt,wrap];};

  /* Übungen */
  P.practice=(cid,qs)=>{const type=new URLSearchParams(qs).get('typ');
    let list=items.filter(i=>(!cid||i.chapter===cid)&&(!type||i.type===type));
    const types=[...new Set(items.map(i=>i.type))];
    const base=cid?'#/ueben/'+cid:'#/ueben';
    const filt=h('div',{},h('div',{class:'filters'},h('button',{type:'button','aria-pressed':!cid,onclick:()=>location.hash='#/ueben'+(type?'?typ='+type:'')},'Alle Kapitel'),CH.map(c=>h('button',{type:'button','aria-pressed':cid===c.id,onclick:()=>location.hash='#/ueben/'+c.id+(type?'?typ='+type:'')},'Kap. '+c.no))),
      h('div',{class:'filters'},h('button',{type:'button','aria-pressed':!type,onclick:()=>location.hash=base},'Alle Typen'),types.map(t=>h('button',{type:'button','aria-pressed':type===t,onclick:()=>location.hash=base+'?typ='+t},UI.TYPE[t]))));
    const wrong=items.filter(i=>{const r=Store.item(i.id);return r&&r.wrong>r.correct;});
    let score=h('span',{class:'label'},'');let ok=0,n=0;const upd=v=>{n++;if(v)ok++;score.textContent=`Diese Sitzung: ${ok}/${n} richtig`;};
    return [h('span',{class:'label'},`${list.length} Übungen · Sofort-Feedback`),h('h1',{},'Üben'),filt,
      wrong.length?h('div',{class:'gap'},h('span',{class:'label'},`${wrong.length} Fehler-Items`),' ',h('a',{href:'#/fehler'},'Nur meine Fehler üben →')):null,
      h('p',{class:'note'},'Hinweis: Glossar-Items sind automatisch erzeugt (Distraktoren aus derselben Begriffsgruppe); Rechenaufgaben nu-01…nu-12 sind Lehrbeispiele mit eigenen Zahlen (außer nu-07/nu-09).'),
      score,list.map(i=>UI.practiceCard(i,upd))];};
  P.mistakes=()=>{const wrong=items.filter(i=>{const r=Store.item(i.id);return r&&r.wrong>0&&r.wrong>=r.correct;});
    return [h('h1',{},'Meine Fehler'),wrong.length?wrong.map(i=>UI.practiceCard(i)):h('p',{},'Keine offenen Fehler. ',h('a',{href:'#/ueben'},'Weiter üben →'))];};

  /* Lerntraining A01–A30: offen, Musterlösung + Selbstbewertung */
  P.tasks=(cid)=>{const T=D['tasks-A'].tasks.filter(t=>!cid||t.chapters.includes(cid));
    return [h('span',{class:'label'},'Lerntraining · offene Aufgaben mit Musterlösung'),h('h1',{},'Aufgaben A01–A30'),
      h('p',{class:'note'},'Kurzantworten werden nicht automatisch korrigiert. Schreibe deine Antwort, öffne die Musterlösung und bewerte dich selbst.'),
      h('div',{class:'filters'},h('button',{type:'button','aria-pressed':!cid,onclick:()=>location.hash='#/aufgaben'},'Alle'),CH.map(c=>h('button',{type:'button','aria-pressed':cid===c.id,onclick:()=>location.hash='#/aufgaben/'+c.id},'Kap. '+c.no))),
      T.map(t=>{const sol=h('div',{class:'solution',hidden:true,html:`<p class="label" style="color:var(--bh-ink-2)">${esc(t.solutionTitle||'Musterlösung')}</p>`+t.solutionHtml});const r=Store.item(t.id);
        const self=h('div',{class:'row',hidden:true},h('span',{class:'label'},'Selbstbewertung:'),h('button',{type:'button',class:'btn',onclick:e=>{Store.record(t.id,true);e.target.parentNode.innerHTML='<span class="label">✓ Gespeichert: gekonnt</span>';}},'Gekonnt'),
          h('button',{type:'button',class:'btn btn--ghost',onclick:e=>{Store.record(t.id,false);e.target.parentNode.innerHTML='<span class="label">Gespeichert: wiederholen</span>';}},'Noch unsicher'));
        return h('div',{class:'item panel',id:t.id},h('div',{class:'qhead'},h('span',{class:'label'},t.id+' · '+t.chapters.map(UI.chapterLabel).join(', ')),h('span',{class:'label'},r?`${r.correct}× gekonnt`:'')),
          h('div',{class:'prompt'},t.prompt),h('textarea',{class:'inp','aria-label':'Antwort '+t.id}),
          h('div',{class:'row',style:'margin-top:12px'},h('button',{type:'button',class:'btn btn--ghost',onclick:e=>{sol.hidden=!sol.hidden;self.hidden=false;e.target.textContent=sol.hidden?'Musterlösung zeigen':'Musterlösung verbergen';}},'Musterlösung zeigen')),sol,self);})];};

  P.summaries=()=>{const G=Object.fromEntries(D.glossary.terms.map(t=>[t.id,t])),M=Object.fromEntries(D['common-mistakes'].mistakes.map(m=>[m.id,m]));
    return [h('span',{class:'label'},'Kompakt vor der Klausur'),h('h1',{},'Zusammenfassungen'),D.summaries.summaries.map(s=>{const c=chap(s.chapter);
      return h('section',{class:'sec',id:s.chapter},h('span',{class:'label'},`Kapitel ${String(c.no).padStart(2,'0')}`),h('h2',{},s.title),h('p',{},s.core),
        h('div',{class:'grid grid--2'},
          h('div',{class:'panel'},h('span',{class:'label'},'Kernpunkte'),h('ul',{},s.keyPoints.map(k=>h('li',{},k)))),
          h('div',{class:'panel'},h('span',{class:'label'},'Schlüsselbegriffe'),h('dl',{},s.keyTerms.map(id=>G[id]?[h('dt',{style:'font-weight:600;margin-top:8px'},G[id].term),h('dd',{style:'margin:0;color:var(--bh-text-2)'},G[id].definition)]:null))),
          s.formulas.length?h('div',{class:'panel'},h('span',{class:'label'},'Formeln'),s.formulas.map(f=>h('p',{style:'font-family:var(--font-mono)'},f))):null,
          s.commonMistakes.length?h('div',{class:'panel'},h('span',{class:'label'},'Typische Fehler'),s.commonMistakes.map(id=>M[id]?h('p',{},h('strong',{},M[id].title+': '),M[id].text):null)):null),
        h('p',{class:'label'},`Folien ${s.slides.join(', ')} · Kummer S. ${s.kummer.join(', ')} · Lerntraining ${s.trainingTasks.join(', ')}`),
        h('div',{class:'row'},h('a',{class:'btn btn--ghost',href:'#/kapitel/'+s.chapter},'Zum Kapitel'),h('a',{class:'btn btn--ghost',href:'#/ueben/'+s.chapter},'Üben')));})];};

  function vidCard(lid){const l=byId[lid],c=chap(l.chapter),k=c.lessons.indexOf(lid)+1,v=LV[lid];
    return h('a',{class:'card vcard',href:'#/lektion/'+lid},v.poster?h('img',{src:v.poster,alt:'',loading:'lazy',class:'vposter'}):null,
      h('span',{class:'label'},`${c.no}.${k} · ${UI.dur(v.duration)}`),h('h3',{},l.title));}
  P.videos=()=>{const n=Object.keys(LV).length,tot=Object.values(LV).reduce((a,v)=>a+(v.duration||0),0);
    return [h('span',{class:'label'},`${n} eigene Lernvideos · ${Math.round(tot/60)} min · deutsche Untertitel · lokal gespeichert`),h('h1',{},'Videos'),
      h('p',{class:'note'},'Jedes Video gehört zu einer Lektion und erklärt deren Inhalt. Klick öffnet die Lektion mit Video, Text und Übungen.'),
      CH.map(c=>{const vs=c.lessons.filter(x=>LV[x]);if(!vs.length)return null;
        return h('section',{class:'sec',id:'v-'+c.id},h('span',{class:'label'},`Kapitel ${String(c.no).padStart(2,'0')} · ${vs.length} Videos`),h('h2',{style:'font-size:32px'},c.title),h('div',{class:'grid'},vs.map(vidCard)));})];};
  P.glossary=()=>{const f=h('input',{class:'inp',type:'search',placeholder:'Begriff filtern …','aria-label':'Glossar filtern'});
    const list=h('div',{});const draw=()=>{const q=f.value.toLowerCase();list.innerHTML='';
      list.append(h('table',{class:'data stack'},h('thead',{},h('tr',{},h('th',{},'Begriff'),h('th',{},'Definition'),h('th',{},'Kapitel'))),h('tbody',{},D.glossary.terms.filter(t=>(t.term+t.definition).toLowerCase().includes(q)).map(t=>h('tr',{},h('td',{style:'font-weight:600','data-l':'Begriff'},t.term),h('td',{'data-l':'Definition'},t.definition),h('td',{class:'label','data-l':'Kapitel'},t.chapters.map(c=>UI.chapterLabel(c)).join(', ')))))));};
    f.oninput=draw;draw();
    return [h('h1',{},'Glossar'),f,list,h('section',{class:'sec'},h('span',{class:'label'},'Abkürzungen'),h('table',{class:'data stack'},h('tbody',{},D.glossary.abbreviations.map(a=>h('tr',{},h('td',{style:'font-family:var(--font-mono)'},a.abbr),h('td',{},a.meaning)))))),
      h('section',{class:'sec'},h('span',{class:'label'},'Formeln'),D.glossary.formulas.map(x=>h('p',{style:'font-family:var(--font-mono)'},typeof x==='string'?x:(x.formula||x.text||JSON.stringify(x)))))];};

  P.progress=()=>{const st=Store.state,tests=st.tests.slice().reverse();
    const file=h('input',{type:'file',accept:'application/json',hidden:true,onchange:async e=>{try{Store.import(await e.target.files[0].text());App.render();}catch(err){alert('Import fehlgeschlagen: '+err.message);}}});
    return [h('span',{class:'label'},'Lokal gespeichert · localStorage „uss.v1“ · Datenmodell v'+st.version),h('h1',{},'Fortschritt'),
      h('table',{class:'data stack'},h('thead',{},h('tr',{},['Kapitel','Lektionen','Übungen richtig','Karteikarten fällig',''].map(x=>h('th',{},x)))),
        h('tbody',{},CH.map(c=>{const s=chapStats(c);return h('tr',{},h('td',{'data-l':'Kapitel'},`${c.no}. ${c.title}`),h('td',{'data-l':'Lektionen'},`${s.done}/${s.ls}`,bar(pct(s.done,s.ls))),h('td',{'data-l':'Übungen richtig'},`${s.ok}/${s.its}`,bar(pct(s.ok,s.its))),h('td',{'data-l':'Karteikarten fällig'},String(s.due)),h('td',{},h('a',{href:'#/kapitel/'+c.id},'Öffnen')));}))),
      h('section',{class:'sec'},h('span',{class:'label'},'Probeklausuren'),tests.length?h('table',{class:'data stack'},h('thead',{},h('tr',{},['Datum','Variante','Punkte','Note','Dauer',''].map(x=>h('th',{},x)))),
        h('tbody',{},tests.map((t,i)=>h('tr',{},h('td',{},new Date(t.date).toLocaleString('de-AT')),h('td',{},t.mode==='auto'?'Auto (30 Items)':'K01–K10'),h('td',{},String(t.points).replace('.',',')+' / 100'),h('td',{},t.grade+' '+t.gradeLabel),h('td',{},Math.round(t.seconds/60)+' min'),h('td',{},h('a',{href:'#/ergebnis/'+(st.tests.length-1-i)},'Review')))))):h('p',{class:'note'},'Noch keine Probeklausur.')),
      h('section',{class:'sec row'},h('button',{type:'button',class:'btn btn--ghost',onclick:()=>{const a=h('a',{href:URL.createObjectURL(new Blob([Store.export()],{type:'application/json'})),download:'fortschritt-uss.v1.json'});document.body.append(a);a.click();a.remove();}},'Exportieren'),
        h('button',{type:'button',class:'btn btn--ghost',onclick:()=>file.click()},'Importieren'),file,
        h('button',{type:'button',class:'btn',id:'reset',onclick:()=>{if(confirm('Gesamten Fortschritt dieses Kurses löschen?')){Store.reset();App.render();}}},'Fortschritt zurücksetzen'))];};

  P.search=(q)=>{q=decodeURIComponent(q||'').trim();const ql=q.toLowerCase();if(!q)return [h('h1',{},'Suche')];
    const strip=s=>s.replace(/<[^>]+>/g,' ');const hits=[];
    LS.forEach(l=>{const t=strip(l.html),i=t.toLowerCase().indexOf(ql);if(i>=0||l.title.toLowerCase().includes(ql))hits.push({href:'#/lektion/'+l.id,label:'Lektion · '+UI.chapterLabel(l.chapter),title:l.title,snip:i>=0?t.slice(Math.max(0,i-80),i+120):''});});
    D.glossary.terms.forEach(t=>{if((t.term+' '+t.definition).toLowerCase().includes(ql))hits.push({href:'#/glossar',label:'Glossar',title:t.term,snip:t.definition});});
    D['tasks-A'].tasks.forEach(t=>{if(t.prompt.toLowerCase().includes(ql))hits.push({href:'#/aufgaben',label:'Aufgabe '+t.id,title:t.prompt.slice(0,90),snip:''});});
    const mk=s=>{const e=h('p',{class:'note'});e.innerHTML=esc(s).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),m=>`<mark>${m}</mark>`);return e;};
    return [h('span',{class:'label'},`${hits.length} Treffer`),h('h1',{},'Suche: '+q),hits.slice(0,60).map(x=>h('a',{class:'card',href:x.href,style:'margin-bottom:12px'},h('span',{class:'label'},x.label),h('h3',{},x.title),x.snip?mk(x.snip):null))];};
  P.notfound=()=>[h('h1',{},'Seite nicht gefunden'),h('a',{href:'#/'},'Zur Startseite')];
  window.Pages=P;
})();
