/* Fortschritt: localStorage-Schlüssel "uss.v1" – versioniertes Datenmodell
   {version:1, courseId, items:{id:{seen,correct,wrong,ease,interval,due,last}}, lessons:{id:ts}, tests:[...] } */
(function(){
  const KEY='uss.v1', D=window.USS_DATA, CID=D.course.id, DAY=864e5;
  function blank(){return {version:1,courseId:CID,items:{},lessons:{},tests:[],created:Date.now()};}
  function loadAll(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}}
  // Mehrere Kurse teilen sich den Namespace: uss.v1 = {courses:{courseId:state}}
  function load(){const all=loadAll();const s=(all.courses||{})[CID];return s&&s.version===1?s:blank();}
  let state=load();
  function save(){const all=loadAll();all.courses=all.courses||{};all.courses[CID]=state;all.schema='uss.v1';try{localStorage.setItem(KEY,JSON.stringify(all));}catch(e){}}
  function it(id){return state.items[id]||(state.items[id]={seen:0,correct:0,wrong:0,ease:2.5,interval:0,due:0,last:0});}
  const Store={
    get state(){return state;},
    /* Ergebnis eines Übungs-Items (auch für Wiederholung fällig machen) */
    record(id,ok){const r=it(id);r.seen++;ok?r.correct++:r.wrong++;r.last=Date.now();
      sm2(r,ok?4:1);save();},
    /* Karteikarte bewerten: q 1=Nochmal 3=Schwer 4=Gut 5=Leicht (SM-2 vereinfacht) */
    rate(id,q){const r=it(id);r.seen++;q>=3?r.correct++:r.wrong++;r.last=Date.now();sm2(r,q);save();},
    lessonDone(id){state.lessons[id]=Date.now();save();},
    isLessonDone(id){return !!state.lessons[id];},
    addTest(t){state.tests.push(t);save();},
    isDue(id){const r=state.items[id];return !r||r.due<=Date.now();},
    item(id){return state.items[id];},
    reset(){state=blank();save();},
    export(){return JSON.stringify(state,null,1);},
    import(txt){const s=JSON.parse(txt);if(s.version!==1||s.courseId!==CID)throw new Error('Falsches Format');state=s;save();}
  };
  function sm2(r,q){
    if(q<3){r.interval=0;r.due=Date.now()+10*60e3;}
    else{r.interval=r.interval<1?1:(r.interval<3?3:Math.round(r.interval*r.ease*(q===3?0.8:q===5?1.3:1)));
      r.due=Date.now()+r.interval*DAY;}
    r.ease=Math.max(1.3,r.ease+(0.1-(5-q)*(0.08+(5-q)*0.02)));
  }
  window.Store=Store;
})();
