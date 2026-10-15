/* Router (Hash-basiert, funktioniert auch per file://) */
(function(){
  const main=document.getElementById('main'),P=Pages,X=Exam;
  const routes=[[/^$/,()=>P.home()],[/^kapitel$/,()=>P.chapters()],[/^kapitel\/(k\d+)$/,m=>P.chapter(m[1])],[/^lektion\/([\w-]+)$/,m=>P.lesson(m[1])],
    [/^karteikarten(?:\/(k\d+))?$/,m=>P.flashcards(m[1])],[/^ueben(?:\/(k\d+))?(?:\?(.*))?$/,m=>P.practice(m[1],m[2]||'')],[/^fehler$/,()=>P.mistakes()],
    [/^aufgaben(?:\/(k\d+))?$/,m=>P.tasks(m[1])],[/^probeklausur$/,()=>X.landing()],[/^probeklausur\/auto$/,()=>X.auto()],[/^probeklausur\/k$/,()=>X.k()],
    [/^ergebnis\/(\d+)$/,m=>X.result(m[1])],[/^zusammenfassungen$/,()=>P.summaries()],[/^videos$/,()=>P.videos()],[/^glossar$/,()=>P.glossary()],
    [/^interaktiv$/,()=>P.interactive()],[/^fortschritt$/,()=>P.progress()],[/^suche\/(.*)$/,m=>P.search(m[1])]];
  function render(){let path=location.hash.replace(/^#\/?/,'');let anchor=null;
    const ai=path.indexOf('#');if(ai>=0){anchor=path.slice(ai+1);path=path.slice(0,ai);}
    if(!/^probeklausur\/|^ergebnis/.test(path))Exam.stop();
    let out=null;for(const[re,fn]of routes){const m=path.match(re);if(m){out=fn(m);break;}}
    if(!out)out=P.notfound();main.innerHTML='';main.append(...[out].flat(3).filter(Boolean));
    document.querySelectorAll('#mainnav a').forEach(a=>{const t=a.getAttribute('href').slice(2);a.toggleAttribute('aria-current',t?path.split(/[\/?]/)[0]===t.split('/')[0]||(t==='kapitel'&&/^lektion/.test(path)):path==='');});
    document.getElementById('mainnav').classList.remove('open');
    const st=Store.state,due=USS_DATA.flashcards.cards.filter(c=>st.items[c.id]&&st.items[c.id].due<=Date.now()).length,done=Object.keys(st.lessons).length;
    document.getElementById('status').innerHTML=`<span>STATUS: <b>LOKAL</b></span><span>LEKTIONEN ${done}/${USS_DATA.lessons.lessons.length}</span><span>FÄLLIG <b>${due}</b></span><span>KLAUSUR 09.11.2026 · 18:00 · L-304</span>`;
    const h1=main.querySelector('h1,h2');document.title=(h1?h1.textContent+' – ':'')+'GDV Lernseite';
    if(anchor){const el=document.getElementById(anchor);if(el){el.scrollIntoView();return;}}window.scrollTo(0,0);main.focus({preventScroll:true});}
  window.addEventListener('hashchange',render);
  document.getElementById('searchform').addEventListener('submit',e=>{e.preventDefault();location.hash='#/suche/'+encodeURIComponent(document.getElementById('q').value);});
  const mb=document.getElementById('menubtn');mb.onclick=()=>{const n=document.getElementById('mainnav');n.classList.toggle('open');mb.setAttribute('aria-expanded',n.classList.contains('open'));};
  window.App={render};render();
})();
