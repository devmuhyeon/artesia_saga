$(function () {
  'use strict';
  const key = 'arkesia-chronicle-v1';
  const stats = ['힘','민첩','지력','센스','체력','마나'];
  const elements = ['화염','물','번개','대지','바람'];
  const favorableElements = [[3,4],[0,3],[0,1],[2,4],[1,2]];
  const bossElements = [3,4,2,3,0,1,2];
  const jobs = [
    ['전사','용병','기사','대장장이','검투사'], ['도적','암살자','무용수','정찰병','곡예사'],
    ['학자','의사','상인','관료','법률가'], ['사냥꾼','궁수','탐험가','음유시인','요리사'],
    ['수호병','경비병','농부','광부','목수'], ['마법사','연금술사','신관','주술사','마법치유사']
  ];
  const people = [
    {name:'세라',gender:'girl',image:1,specialty:0,bio:'약초와 지도를 연구하는 동급생. 작은 약속도 기억한다.',gift:'늘 관찰한 것을 먼저 적어 두는 편이야.'},
    {name:'이네스',gender:'girl',image:4,specialty:3,bio:'마도 실습에서 늘 앞서가는 동급생. 솔직한 말을 좋아한다.',gift:'손에 익을 때까지 한 번 더 해보자.'},
    {name:'카엘',gender:'boy',image:2,specialty:1,bio:'실습조를 맡은 견습 기사. 동료들과 함께 성장하고 싶어 한다.',gift:'좋아. 다음엔 내가 먼저 도전할 차례야.'},
    {name:'루안',gender:'boy',image:4,specialty:3,bio:'별자리와 고문서를 읽는 동급생. 혼자 생각할 시간이 필요하다.',gift:'네가 본 걸 내 노트에도 적어도 될까?'},
    {name:'리온',gender:'boy',image:1,specialty:2,bio:'훈련장 정리를 도맡는 동급생. 대련을 신청하면 빠지는 법이 없다.',gift:'오늘은 자세부터 같이 맞춰 보자.'},
    {name:'노엘',gender:'boy',image:3,specialty:0,bio:'왕국의 옛 기록을 정리하는 동급생. 기록마다 다른 날짜를 그냥 넘기지 않는다.',gift:'같은 사건인데 두 기록의 날짜가 다르네.'},
    {name:'엘린',gender:'girl',image:2,specialty:2,bio:'기동 훈련에서 팀의 선두를 맡는 동급생. 먼저 가서 안전한 길을 확인한다.',gift:'다음 훈련에서는 내가 길을 먼저 살펴볼게.'},
    {name:'미라',gender:'girl',image:3,specialty:1,bio:'실습장을 자주 찾는 동급생. 다른 학생이 놓친 주문의 원리를 짚어 준다.',gift:'식의 순서를 바꾸면 어떤 결과가 나올까?'}
  ];
  const bosses = ['잿빛 감시자','수몰 회랑의 맹수','천둥의 추적자','석문 거인','하늘날개 파수꾼','청류의 수문장','뇌전 군주'];
  const groups = ['노말','희귀','영웅','전설','신화','오리진'];
  const combatSkills = [
    {category:'물리', name:'근접 공격', effect:'공격', range:'근거리', stats:[0,1], icon:'⚔'},
    {category:'마법', name:'원거리 공격', effect:'공격', range:'원거리', stats:[5,2], icon:'✦'},
    {category:'유틸', name:'거리 유지', range:'거리 조절', stats:[3,4], icon:'◇'}
  ];
  const expeditionStamina = 20;
  const skillPracticeStamina = 8;
  const gearPower = tier => tier*6;
  const characterTabs = [['stats','능력치'],['equipment','장비'],['skills','스킬']];
  const achievements = [
    ['마음의 동반자',s=>s.spouse!==null], ['가문의 초석',s=>Boolean(s.house)],
    ['아르테시아의 대학자',s=>s.research>=24], ['대마법사',s=>s.values[5]>=85],
    ['전설의 모험가',s=>s.floor===7], ['대륙 통일',s=>s.influence>=100],
    ['번영의 상징',s=>s.money>=1000000], ['평온한 삶',s=>s.rests>=36]
  ];
  const $game = $('#game');
  const plot = $.arkesiaStory;
  const academy = $.arkesiaAcademy;
  let saveData;
  try { saveData=JSON.parse(localStorage.getItem(key)); } catch {}
  let s=saveData?.version===1?saveData:null;
  if(s && !s.story){
    s.story=plot.create();
    if(s.stage==='adult')s.story.start=s.turn;
  }
  if(s){
    s.stamina=s.stamina??s.energy??100;
    s.semesterReports??=[];
    s.skills??={};
    if(s.graduationTurn==null){
      const graduated=Boolean(s.job||s.stage==='career'||s.story.start!=null);
      const previousAdmissionAge=s.admissionAge??13;
      if(s.admissionAge==null){
        s.legacyLessons=academy.legacyLessonIds.slice(0,Math.floor(s.turn/6));
        const pending=s.pendingSemester?.term;
        if(pending)pending.lessonId??=academy.legacyLessonIds[Math.floor(pending.startTurn/6)];
      }
      s.admissionAge=graduated?previousAdmissionAge:academy.admissionAge;
      s.graduationTurn=graduated?(18-previousAdmissionAge)*12:academy.finalTurn;
      if(s.element==null&&s.turn>=academy.awakeningEnd)s.elementCurriculum=false;
    }
    s.termSocial??=[];
    s.termEvents??=[];
    const playerIndex=people.findIndex(person=>person.gender===s.gender&&person.image===s.portrait);
    if(s.partner===playerIndex)s.partner=null;
    s.relations=people.map((_,i)=>{
      if(i===playerIndex&&s.spouse!==i)return null;
      const relation=s.relations?.[i];
      return relation&&(relation.like||relation.trust||relation.jealous||relation.bond||relation.rival||s.spouse===i||s.partner===i)?relation:null;
    });
    const updateLog=line=>line.replace(/ · 권능의 파편 획득$/, '').replace(/기력/g,'스태미나');
    s.log=s.log.map(updateLog);
    s.years.forEach(year=>{year.summary=year.summary.map(updateLog);});
    if(s.latest)s.latest=updateLog(s.latest);
    delete s.type;
    delete s.focus;
    delete s.energy;
    delete s.fate;
    delete s.shards;
    delete s.talents;
  }
  let semesterPicks=[];
  let page='intro', draft;
  let storageFailed=false;
  let semesterTimer;
  const $escape = v => $('<span>').text(String(v)).html();
  const clamp = (v,min=0,max=100)=>Math.min(max,Math.max(min,v));
  const random = n=>Math.floor(Math.random()*n);
  const month = ()=>s.turn%12+1;
  const age = ()=>s.admissionAge+Math.floor(s.turn/12);
  const graduationTurn = ()=>s.graduationTurn;
  const active = ()=>s&&s.stage!=='end';
  const report = msg=>$('#status').text(msg);
  const portrait = (gender,i)=>'art/'+gender+'-'+i+'.webp';
  const playerPerson = person=>person.gender===s.gender&&person.image===s.portrait;
  const specialty = ()=>people.find(playerPerson)?.specialty;
  const elementLabel = ()=>elements[s.element]?'속성 '+elements[s.element]:'속성 미각성';
  const draftPerson = ()=>people.findIndex(person=>person.gender===draft.gender&&person.image===draft.portrait);
  const button = (id,title,desc='')=>'<button type="button" class="option" data-action="'+id+'"><strong>'+title+'</strong>'+(desc?'<span>'+desc+'</span>':'')+'</button>';
  const primary = (id,title)=>'<button type="button" class="primary" data-action="'+id+'">'+title+'</button>';
  const heading = (tag,title,lead='')=>'<p class="eyebrow">'+tag+'</p><h1 tabindex="-1">'+title+'</h1>'+(lead?'<p class="lede">'+lead+'</p>':'');
  const money = v=>Math.floor(v/10000)+'금 '+Math.floor(v%10000/100)+'은 '+(v%100)+'동';
  function freeMonths(){
    return Math.min(12,(100-s.admissionAge)*12-s.turn,s.story.result?Infinity:Math.max(1,plot.deadline(s.story)-s.turn));
  }
  function persist(){
    try{localStorage.setItem(key,JSON.stringify(s));}catch{storageFailed=true;}
  }
  function say(message){s.latest=message;s.log.push(age()+'세 '+month()+'월 · '+message);}
  function goto(next){
    clearTimeout(semesterTimer);
    page=next;render();$game.find('h1').trigger('focus');window.scrollTo(0,0);
    if(next==='simulation')scheduleSemester();
  }
  function statView(values, max=100){
    return '<dl class="stats">'+values.map((value,i)=>'<div><dt>'+stats[i]+'</dt><dd><meter min="0" max="'+max+'" value="'+value+'" aria-label="'+stats[i]+' '+value+'"></meter></dd><dd>'+value+'</dd></div>').join('')+'</dl>';
  }
  function rollAttributes(person){
    const values=[2,2,2,2,10,10];
    for(let point=0;point<18;point++)values[random(4)]++;
    values[person.specialty]+=5;
    return values;
  }
  function registrationRoster(gender){
    return people.filter(person=>person.gender===gender).sort((a,b)=>a.specialty-b.specialty);
  }
  function register(){
    draft??={gender:'boy',portrait:registrationRoster('boy')[0].image,names:{},rolls:people.map(rollAttributes),rerolls:3};
    goto('create');
  }
  function rerollAttributes(control){
    if(!draft.rerolls)return;
    const index=draftPerson();
    const values=rollAttributes(people[index]);
    draft.rolls[index]=values;
    draft.rerolls--;
    $('#starting-stats').html(selectedAttributes());
    $('#rerolls-remaining').text('남은 횟수 '+draft.rerolls+'회');
    if(!draft.rerolls)$(control).attr('aria-disabled','true');
    report(stats.slice(0,4).map((name,i)=>name+' '+values[i]).join(', ')+'. 총합 '+total(values)+'점. 남은 횟수 '+draft.rerolls+'회.');
  }
  function init(player, values, replay=null){
    s={version:1,...player,values,element:null,elementCurriculum:true,admissionAge:academy.admissionAge,graduationTurn:academy.finalTurn,major:null,stage:'school',turn:0,money:3000,stamina:100,
      years:[],semesterReports:[],termSocial:[],termEvents:[],skills:{},job:null,career:0,research:0,influence:0,
      rests:0,house:'',spouse:null,family:0,relations:people.map(()=>null),
      floor:0,equipment:0,partner:null,partyFunds:0,log:[],
      entryValues:[...values],story:plot.create(replay?.story)};
    draft=null;semesterPicks=[];report('');
    say('아카데미에 입학했다.');persist();goto('life');
  }
  function replayStory(){
    const values=s.entryValues||s.years.reduce((base,year)=>base.map((value,i)=>value-year.growth[i]), s.yearBase);
    init({name:s.name,gender:s.gender,portrait:s.portrait},[...values],s);
  }
  function monthPass(message, elapsed=1){
    say(message);s.turn+=elapsed;
    const milestone=plot.advance(s.story,s.turn);
    if(milestone && !s.story.result)say(milestone);
    if(s.story.result && s.story.result!=='true'){
      s.stage='end';persist();goto('story');return;
    }
    if(age()===100)s.stage='end';
    persist();goto(s.story.result==='true'&&page==='story'?'story':s.stage==='end'?'end':milestone?'story':page);
  }
  function meet(person){
    if(!people[person]||playerPerson(people[person])||s.relations[person])return '';
    s.relations[person]={like:10,trust:0,jealous:0,bond:0};
    return people[person].name+'에게 처음 인사를 건넸다.';
  }
  function schoolEvent(message){
    s.termEvents.push({month:month(),text:message});
    say(message);persist();goto(page);
  }
  const schoolIncidents = [
    ['도서관의 뒤바뀐 책','반납대에서 서로 뒤바뀐 교재를 찾아 주고, 사서와 함께 책의 주인을 확인했다.'],
    ['빗속의 운동장','갑자기 소나기가 내리자 수업이 중단됐다. 학생들과 함께 젖기 전에 실습 도구를 옮겼다.'],
    ['기숙사의 새 식구','식당 뒤편에 숨어 있던 고양이에게 학생들이 이름을 붙이고 번갈아 돌보기로 했다.'],
    ['빈 게시판','바람에 날아간 동아리 안내문을 주워 다시 붙였다. 덕분에 처음 보는 동아리도 구경했다.'],
    ['온실의 작은 소동','열린 문으로 새가 들어왔다. 조원들과 창을 열어 새를 내보낸 뒤 수업을 재개했다.'],
    ['학교 축제 준비','교실을 꾸미다가 다른 반 학생들과 재료를 나눠 썼다. 완성된 장식을 함께 복도에 걸었다.'],
    ['꺼진 복도의 등불','복도의 마력등이 꺼졌다. 학생들은 교사의 안내에 따라 창가 쪽 교실로 이동했다.'],
    ['운동장의 분실물','수업이 끝난 뒤 주운 기숙사 이름표을 교무실에 맡겼다. 다음 날 주인이 찾아와 고맙다고 인사했다.']
  ];
  const fieldIncidents = [
    ['첫 교외 답사','갈림길에서 두 조의 지도가 달랐다. 인솔 교사와 함께 출발점으로 돌아가 빠진 표식을 찾아냈다.'],
    ['밤길의 불빛','야간 실습 중 다른 조의 등불이 꺼졌다. 마력 신호로 위치를 확인하고 함께 숙영지로 돌아왔다.'],
    ['허물어진 나무다리','실습 길목의 다리가 무너져 있었다. 조원들과 건널 수 있는 곳을 찾아 지도를 수정했다.']
  ];
  const guildIncidents = [
    ['길드의 첫 의뢰서','인솔 교관과 함께 마을의 실종 짐꾼 의뢰를 맡았다. 주민에게 마지막으로 본 장소를 묻고 수색 범위를 좁혔다.'],
    ['돌아오지 않은 실습조','교신이 끊긴 조를 찾기 위해 예정 경로를 확인했다. 합류한 뒤 교관에게 전원 복귀를 보고했다.'],
    ['호위로가 막힌 날','비에 불어난 여울 때문에 보급 마차가 멈췄다. 조원들과 우회로를 확인하고 길드에 도착 시간을 알렸다.']
  ];
  function campusEvents(term, months, introductions){
    const recentTerms=s.semesterReports.filter(record=>record.year===term.year);
    const hadCampusEvents=recentTerms.some(record=>record.campusEvents?.length);
    const events=term.term===1?['friend']:hadCampusEvents?['school']:['friend','school'];
    if(term.term===1&&random(2)===1)events.push('school');
    const eligibleMonths=months.slice(months.length>=4?2:0);
    const previousTitles=new Set(recentTerms.flatMap(record=>record.campusEvents??[]).map(event=>event.title));
    const incidentPool=term.year<=5?schoolIncidents:term.year<=11?fieldIncidents:guildIncidents;
    const incidents=incidentPool.filter(([title])=>!previousTitles.has(title));
    return events.slice(0,eligibleMonths.length).map(kind=>{
      const first=kind==='friend'&&eligibleMonths[0]===months[0]&&months.length>1?1:0;
      const [scene]=eligibleMonths.splice(first+random(eligibleMonths.length-first),1);
      if(kind==='school'){
        const [title,text]=incidents[random(incidents.length)];
        return {month:scene.month,title,text};
      }
      const classmates=people.map((person,index)=>index).filter(index=>!playerPerson(people[index]));
      const familiar=classmates.filter(index=>s.relations[index]||introductions.includes(index));
      const candidates=familiar.length?familiar:classmates;
      const person=candidates[random(candidates.length)];
      const relation=s.relations[person];
      const like=Math.min(7,100-(relation?.like??10));
      const trust=Math.min(10,100-(relation?.trust??0));
      const name=people[person].name;
      const familiarEvents = [
        ['수업 뒤 간식','수업이 끝난 뒤 '+name+'에게 간식을 건네고 이야기를 나눴다.'],
        ['함께 한 과제',name+'의 제안으로 과제를 같이 정리했다. 서로 어려웠던 문제를 한 가지씩 설명했다.'],
        ['복도에서 나눈 이야기','복도에서 '+name+'에게 인사를 받았다. 다음 수업까지 잠깐 걸으며 서로의 하루를 이야기했다.']
      ];
      const [title,description]=relation||introductions.includes(person)?familiarEvents[random(familiarEvents.length)]:
        ['새로운 인연','빈자리에 앉아도 되냐는 '+name+'의 물음에 고개를 끄덕였다. 함께 점심을 먹으며 처음 인사를 나눴다.'];
      const text=description+
        (like||trust?' '+[like?'호감도 +'+like:'',trust?'신뢰 +'+trust:''].filter(Boolean).join(' · '):'');
      return {month:scene.month,title,text,person,like,trust};
    });
  }
  function startSemester(picks){
    const term=academy.simulate(s,picks,random,specialty());
    if(!term)return;
    const monthAt=offset=>(term.startTurn+offset)%12+1;
    const events=[{month:monthAt(0),text:term.results.map(result=>result.name).join(', ')+' 수강을 시작했다.'}];
    const practicalMonth=monthAt(Math.min(1,term.elapsed-1));
    const requiredCourse=term.results.find(course=>course.required);
    const majorPractice=s.major==='sword'?'훈련용 검으로 기본 자세를 맞추고 조명 주문으로 짝의 시야를 도왔다.':
      '떨리는 속성 주문을 안정시키고 짝이 설치한 표적을 탐지했다.';
    events.push({month:practicalMonth,text:requiredCourse.name+' 수업. '+term.lessonNote+
      (term.lessonId==='major'?' '+majorPractice:'')});
    if(term.lessonId==='graduation'){
      const job=s.major==='sword'?'검을 든 동료와 교대하며 수색조를 엄호했다.':
        '탐지 주문과 조명으로 수색조가 지날 길을 밝혔다.';
      events.push(
        {month:monthAt(Math.min(2,term.elapsed-1)),text:'길드 의뢰 현장. 마을 밖에서 수레 자국을 찾아 수색 범위를 좁혔다. '+job},
        {month:monthAt(Math.min(4,term.elapsed-1)),text:'파티는 실종자를 찾아 마을로 데려오고, 길드에 조사 경로와 의뢰 결과를 제출했다.'}
      );
    }
    const introductions=[...new Set(term.results.map(result=>result.person))].filter(person=>people[person]&&!playerPerson(people[person])&&!s.relations[person]);
    introductions.forEach(person=>{
      const course=term.results.find(result=>result.person===person);
      events.push({month:practicalMonth,text:course.name+' 수업에서 '+people[person].name+'에게 처음 인사를 건넸다.'});
    });
    const best=term.results.reduce((top,result)=>result.score>top.score?result:top);
    const practical=term.year<=2?'짝과 그림이나 기록을 살펴보고 배운 내용을 교관 앞에서 설명했다.':
      term.year<=5?'교관의 지시에 따라 과제를 마치고 짝과 어려웠던 부분을 되짚었다.':
      '조원들과 배운 내용을 과제에 적용하고 결과를 교관에게 보고했다.';
    events.push(
      {month:monthAt(Math.floor((term.elapsed-1)/2)),text:best.name+' 중간 평가. '+practical},
      {month:monthAt(term.elapsed-1),text:'기말 평가를 마치고 수강 과목별 성적을 받았다.'}
    );
    const months=Array.from({length:term.elapsed},(_,offset)=>{
      const month=monthAt(offset);
      const notes=events.filter(event=>event.month===month).map(event=>event.text);
      const course=term.results[offset%term.results.length];
      return {month,notes:notes.length?notes:[course.name+' 수업에 참석해 실습 과제를 마쳤다.']};
    });
    term.campusEvents=campusEvents(term,months,introductions);
    term.campusEvents.forEach(event=>{
      months.find(scene=>scene.month===event.month).campusEvent=event;
    });
    term.events=[...s.termEvents,...months.flatMap(({month,notes,campusEvent})=>[
      ...notes.map(text=>({month,text})),
      ...(campusEvent?[{month,text:campusEvent.title+' · '+campusEvent.text}]:[])
    ])].sort((a,b)=>a.month-b.month);
    const paused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    s.pendingSemester={term,months,introductions,shown:1,paused};
    recordAwakening(s.pendingSemester);
    s.stage='simulation';semesterPicks=[];report('');persist();goto('simulation');
  }
  function recordAwakening(entry){
    if(entry.term.lessonId!=='awakening'||entry.term.awakening!=null||s.element!=null)return;
    const scene=entry.months[Math.min(2,entry.months.length-1)];
    entry.term.awakening=random(elements.length);
    const text=academy.awakeningName+'에서 '+elements[entry.term.awakening]+' 속성에 각성했다.';
    scene.notes.push(text);
    entry.term.events.push({month:scene.month,text});
    entry.term.events.sort((a,b)=>a.month-b.month);
  }
  function migrateElement(){
    if(s.elementCurriculum)return;
    s.element=s.turn<academy.awakeningEnd?null:(elements[s.element]?s.element:random(elements.length));
    s.elementCurriculum=true;
    if(s.pendingSemester)recordAwakening(s.pendingSemester);
    persist();
  }
  function simulation(){
    const {term,months,shown,paused}=s.pendingSemester;
    const complete=shown===months.length;
    return heading('아카데미 · '+term.year+'학년 '+term.term+'학기','학기 진행')+
      '<section class="folio semester-playback"><label for="semester-progress">학기 진행률</label>'+
      '<progress id="semester-progress" max="'+months.length+'" value="'+shown+'"></progress>'+
      '<p id="semester-progress-text">'+shown+' / '+months.length+'개월</p>'+
      '<div class="semester-controls">'+
      '<button type="button" data-action="semester-pause"'+(complete?' disabled':'')+'>'+(paused?'자동 진행 시작':'자동 진행 일시정지')+'</button>'+
      '<button type="button" data-action="semester-step"'+(complete?' disabled':'')+'>다음 달</button></div>'+
      '<ol id="semester-playback-events" class="semester-events" reversed role="list">'+months.slice(0,shown).reverse().map(monthScene).join('')+'</ol></section>'+
      primary('semester-finish',complete?'학기 성적표 보기':'성적표 바로 보기');
  }
  function monthScene(scene){
    const event=scene.campusEvent;
    return '<li><strong>'+scene.month+'월</strong><ul>'+scene.notes.map(note=>'<li>'+$escape(note)+'</li>').join('')+'</ul>'+
      (event?'<div class="campus-event"><strong>'+$escape(event.title)+'</strong><p>'+$escape(event.text)+'</p></div>':'')+'</li>';
  }
  function scheduleSemester(){
    clearTimeout(semesterTimer);
    const entry=s.pendingSemester;
    if(page==='simulation'&&!entry.paused&&entry.shown<entry.months.length){
      semesterTimer=setTimeout(advanceSemester,2400);
    }
  }
  function advanceSemester(){
    if(page!=='simulation'||s.stage!=='simulation')return;
    const entry=s.pendingSemester;
    if(entry.shown>=entry.months.length)return;
    const scene=entry.months[entry.shown++];
    const complete=entry.shown===entry.months.length;
    $('#semester-playback-events').prepend(monthScene(scene));
    $('#semester-progress').val(entry.shown);
    $('#semester-progress-text').text(entry.shown+' / '+entry.months.length+'개월');
    if(complete){
      const $controls=$game.find('.semester-controls button');
      if($controls.is(':focus'))$game.find('[data-action=semester-finish]').trigger('focus');
      $controls.prop('disabled',true);
      $game.find('[data-action=semester-finish]').text('학기 성적표 보기');
    }
    const event=scene.campusEvent;
    report(scene.month+'월. '+scene.notes.join(' ')+(event?' '+event.title+'. '+event.text:'')+(complete?' 학기 진행이 끝났습니다.':''));
    persist();scheduleSemester();
  }
  function finishSemester(){
    if(s.stage!=='simulation')return;
    const {term,months,introductions}=s.pendingSemester;
    introductions.forEach(meet);
    months.forEach(({month,notes,campusEvent:event})=>{
      const date=age()+'세 '+month+'월 · ';
      notes.forEach(text=>s.log.push(date+text));
      if(!event)return;
      s.log.push(date+event.title+' · '+event.text);
      if(event.person==null)return;
      meet(event.person);
      const relation=s.relations[event.person];
      relation.like=clamp(relation.like+event.like);
      relation.trust=clamp(relation.trust+event.trust);
    });
    if(term.awakening!=null)s.element=term.awakening;
    const skillResults=term.results.filter(result=>result.skill&&result.grade!=='F');
    term.skillTraining=skillResults.map(({skill})=>{
      const previous=s.skills[skill]??0;
      return {skill,previous,level:advanceSkill(skill)};
    }).filter(result=>result.level>result.previous);
    s.values=term.after;
    s.stamina=clamp(s.stamina+30);
    s.turn=term.endTurn;
    s.semesterReports.push(term);
    s.termEvents=[];s.termSocial=[];
    delete s.pendingSemester;
    s.latest=term.year+'학년 '+term.term+'학기를 마쳤다.';
    s.stage='report';persist();goto('report');
    report(term.skillTraining.map(skillTrainingText).join(' '));

  }
  function gain(i,n){s.values[i]=clamp(s.values[i]+n);}
  function effort(cost){
    if(s.stamina>=cost){s.stamina-=cost;return true;}
    const message='스태미나가 부족합니다. 휴식을 선택하세요.';
    if(!$('#feedback').length)$game.find('h1').after('<p id="feedback" class="result"></p>');
    $('#feedback').text(message);report(message);return false;
  }
  function profile(){
    return '<div class="profile"><img src="'+portrait(s.gender,s.portrait)+'" alt=""><div><h3>'+$escape(s.name)+'</h3><p>'+elementLabel()+'</p><p>'+(s.job?s.job.name:'아카데미')+' · 스태미나 '+s.stamina+'</p>'+ (s.major?'<p>'+academy.majors[s.major]+'</p>':'')+'</div></div>';
  }
  function intro(){
    return '<div class="hero" aria-hidden="true"></div>'+heading('아카데미 입학 안내','아르테시아 전기','여덟 살 봄, 아카데미의 입학장이 도착했다. 스무 살에 졸업할 때까지 동료들과 함께 배우고, 마지막 학기에는 길드의 C랭크 의뢰에 도전한다.')+
      (s?primary('resume',$escape(s.name)+' · 이어하기')+button('restart','새 인생 시작','기존 기록은 새 캐릭터 입학을 확정할 때 교체됩니다.'):primary('create','입학장 열기'));
  }
  function portraitOptions(){
    return registrationRoster(draft.gender).map(person=>
      '<label class="portrait"><img src="'+portrait(person.gender,person.image)+'" alt="">'+
      '<input type="radio" name="portrait" value="'+person.image+'" '+(draft.portrait===person.image?'checked':'')+'>'+
      '<span><strong>'+person.name+'</strong> · '+stats[person.specialty]+' 재능</span></label>').join('');
  }
  function selectedAttributes(){
    const index=draftPerson();
    const values=draft.rolls[index];
    return '<h2>시작 능력치</h2><p class="small"><strong>총합 '+total(values)+'점</strong> · 체력과 마나 각 10점</p>'+
      '<p class="small">'+stats[people[index].specialty]+' 재능은 시작 능력치 +5와 관련 과목 성적 +'+academy.talentScoreBonus+'점을 받습니다.</p>'+statView(values,25);
  }
  function create(){
    const index=draftPerson();
    const name=$escape(draft.names[index]??people[index].name).replaceAll('"','&quot;');
    return heading('신입생 등록','주인공 생성')+'<form id="character">'+
      '<label for="gender">성별</label><select id="gender"><option value="boy" '+(draft.gender==='boy'?'selected':'')+'>남성</option><option value="girl" '+(draft.gender==='girl'?'selected':'')+'>여성</option></select>'+
      '<fieldset><legend>캐릭터 선택</legend><div class="portraits">'+portraitOptions()+'</div></fieldset>'+
      '<label for="character-name">이름</label><input type="text" id="character-name" required maxlength="16" value="'+name+'">'+
      '<section id="starting-stats" class="folio">'+selectedAttributes()+'</section>'+
      '<div class="attribute-reroll"><button type="button" data-action="reroll" aria-describedby="rerolls-remaining"'+(draft.rerolls?'':' aria-disabled="true"')+'>능력치 주사위 다시 굴리기</button>'+
      '<p id="rerolls-remaining" class="small">남은 횟수 '+draft.rerolls+'회</p></div>'+
      '<button class="primary" type="submit">이 캐릭터로 입학</button></form>'+button('intro','표지로 돌아가기');
  }
  function updateRegistration(){
    const index=draftPerson();
    $('#character-name').val(draft.names[index]??people[index].name);
    $('#starting-stats').html(selectedAttributes());
    report(people[index].name+' 선택. '+stats[people[index].specialty]+' 재능. 시작 능력치 5점과 관련 과목 성적 '+academy.talentScoreBonus+'점 보너스.');
  }
  const total = values => values.reduce((sum,value)=>sum+value,0);
  const strongest = values => stats[values.indexOf(Math.max(...values))];
  function majorSelection(term){
    return heading('아카데미 · '+term.label,'검과 마법의 갈림길','검술과 마법 중 주전공 하나를 고르세요.')+profile()+
      '<form id="major-form"><fieldset><legend>주전공</legend><div class="semester-courses">'+
      '<label class="semester-course"><input type="radio" name="major" value="sword" required><span><strong>검술 전공</strong><small>검술과 기초 보조 마법을 수련합니다.</small></span></label>'+
      '<label class="semester-course"><input type="radio" name="major" value="magic" required><span><strong>마법 전공</strong><small>속성 주문과 탐지·조명·방호를 수련합니다.</small></span></label>'+
      '</div></fieldset><button type="submit" class="primary">이 전공으로 수련 시작</button></form>';
  }
  function school(){
    const term=academy.current(s.turn,s.major);
    if(s.turn>=academy.majorStart&&!s.major)return majorSelection(term);
    const picks=semesterPicks;
    const electiveCount=academy.maxCourses-1;
    const talent=specialty();
    const courses=term.courses.map(({name,stat,secondary,required,skill},i)=>{
      const attributes=stats[stat]+(secondary===undefined?'':' · '+stats[secondary]);
      const detail=attributes+' 성장'+
        (stat===talent?' · 재능 성적 +'+academy.talentScoreBonus+'점':'');
      const level=skill?s.skills[skill]??0:0;
      const technique=skill?'<small class="course-technique">'+academy.skills[skill].name+
        (level===0?' 습득':level<academy.maxSkillLevel?' 숙련 Lv.'+(level+1):' · 최대 숙련')+'</small>':'';
      const label='<span><strong>'+name+'</strong><small>'+detail+'</small>'+technique+'</span>';
      if(required)return '<div class="semester-course required-course">'+label+'</div>';
      return '<label class="semester-course"><input type="checkbox" name="course" value="'+i+'" '+(picks.includes(i)?'checked':'')+'>'+label+'</label>';
    });
    return heading('아카데미 · '+term.label,'수강 과목 선택',age()+'세 · '+term.theme)+profile()+
      '<form id="semester-form"><section class="folio"><h2>공통 필수</h2>'+courses[0]+'</section>'+
      '<fieldset class="candidate-field" aria-describedby="semester-guide semester-count">'+
      '<legend>선택 과목 7개</legend><p id="semester-guide">아래 과목 중 '+electiveCount+'개를 고르세요.'+
      (s.major?' 기술 과목은 E 이상을 받으면 기술을 배우거나 숙련도가 오릅니다.':'')+'</p>'+
      '<p id="semester-count" class="small semester-count">'+picks.length+' / '+electiveCount+'과목 선택</p>'+
      '<p id="semester-limit" class="small semester-limit" hidden></p>'+
      '<div class="semester-courses">'+courses.slice(1).join('')+'</div></fieldset>'+
      '<button type="submit" class="primary">이번 학기 수강 시작</button></form>'+
      (s.turn>=plot.firstClueTurn(s)?button('story','아카데미의 이상 현상','학기를 시작하기 전에 사건을 조사할 수 있습니다.'):'');
  }
  function life(){
    if(s.stage==='career')return career();
    if(s.stage==='school')return school();
    let out=heading('아르테시아 생애 기록','이번 달 활동')+
      profile()+'<p class="wallet">소지금 <b>'+money(s.money)+'</b></p>';
    if(!s.story.result)out+=button('story','아르덴의 사건 기록','단서를 확인하고 다음 행동을 선택한다.');
    if(s.latest)out+='<p class="result">'+$escape(s.latest)+'</p>';
    out+=button('work',s.job.name+' 업무','수입과 전문 능력 성장 · 스태미나 8 · 1개월');
    out+=button('research','연구 보고서 집필','지력 성장 및 연구 업적 · 스태미나 12 · 1개월');
    out+=button('politics','도시 의회 활동','영향력 상승 · 스태미나 10 · 1개월');
    out+=button('expedition','별탑 원정 준비','보스 속성과 파티를 확인합니다.');
    if(!s.house&&s.money>=5000)out+=button('house','가문 창설','50은 · 1개월');
    if(s.spouse!==null)out+=button('family','가족과 한 달 보내기','가족 기록에 추억을 남깁니다 · 1개월');
    if(s.equipment<5&&s.money>=(s.equipment+1)*5000)out+=button('gear','장비 강화','다음 등급 '+groups[s.equipment+1]+' · '+money((s.equipment+1)*5000));
    out+=button('year-rest',freeMonths()+'개월간 자유 생활','스태미나 회복');
    return out+button('rest','휴식','스태미나 +30 · 1개월');
  }
  function yearValues(y){
    if(y.values)return y.values;
    // Older saves retain the last year-end totals and each year's growth.
    return s.yearBase.map((value,i)=>value-s.years.slice(y.year).reduce((sum,next)=>sum+next.growth[i],0));
  }
  function yearBody(y){
    const after=yearValues(y);
    const growth=total(y.growth);
    const changed=y.bonds.map((n,i)=>n?people[i].name+' '+(n>0?'+':'')+n+'%p':'').filter(Boolean);
    return '<div class="review-banner"><strong>학업 평가 · '+(growth>=24?'우수':growth>=12?'수료':'기초 과정 완료')+'</strong><p>'+ (growth?strongest(y.growth)+'에서 가장 큰 성장을 보였습니다.':'이번 학년에는 능력치 변화가 없었습니다.')+'</p></div>'+
      '<dl class="review-metrics"><div><dt>능력치 성장</dt><dd>+'+growth+'</dd></div><div><dt>이수 기간</dt><dd>12개월</dd></div><div><dt>호감도 변화</dt><dd>'+changed.length+'명</dd></div></dl>'+
      '<section class="folio"><h2>학년 전후 능력치</h2><p class="total-line">합계 <strong>'+(total(after)-growth)+'에서 '+total(after)+'</strong></p><dl class="growth-grid">'+after.map((value,i)=>'<div><dt>'+stats[i]+'</dt><dd><b>'+value+'</b> <span>+'+y.growth[i]+'</span></dd></div>').join('')+'</dl></section>'+
      '<section class="folio"><h2>관계 변화</h2><p>'+(changed.join(' · ')||'호감도 변동 없음')+'</p></section>'+
      '<details class="folio"><summary>월별 활동 기록</summary><ul>'+y.summary.map(l=>'<li>'+$escape(l)+'</li>').join('')+'</ul></details>';
  }
  function semesterBody(term){
    return (term.awakening!=null?'<p class="review-banner"><strong>속성 각성 · '+elements[term.awakening]+'</strong></p>':'')+
      '<section class="folio"><h2>과목별 성적</h2><table class="semester-grades">'+
      '<thead><tr><th scope="col">과목</th><th scope="col">성적</th><th scope="col">능력치 변화</th></tr></thead><tbody>'+
      term.results.map(result=>'<tr><th scope="row">'+result.name+(result.required?' <small>공통 필수</small>':'')+'</th><td><strong>'+result.grade+'</strong><br>'+result.score+'점'+(result.talentBonus?'<br><small>재능 +'+result.talentBonus+'점</small>':'')+'</td><td>'+
        stats[result.stat]+' +'+result.gain+(result.secondary===undefined?'':'<br>'+stats[result.secondary]+' +'+result.secondaryGain)+'</td></tr>').join('')+'</tbody></table></section>'+
      (term.skillTraining?.length?'<section class="folio"><h2>기술 습득과 숙련</h2><ul>'+
        term.skillTraining.map(entry=>'<li>'+skillTrainingText(entry)+'</li>').join('')+'</ul></section>':'')+
      '<section class="folio"><h2>학기 전후 능력치</h2><p class="total-line">능력치 상승 합계 <strong>+'+(total(term.after)-total(term.before))+'</strong></p><dl class="growth-grid">'+term.after.map((value,i)=>
        '<div><dt>'+stats[i]+'</dt><dd>'+term.before[i]+'에서 '+value+' (+'+(value-term.before[i])+')</dd></div>').join('')+'</dl></section>'+
      '<section class="folio"><h2>학기 중 있었던 일</h2><ol class="semester-events">'+term.events.map(event=>
        '<li><strong>'+event.month+'월</strong> '+$escape(event.text)+'</li>').join('')+'</ol></section>';
  }
  function schoolReport(){
    const term=s.semesterReports.at(-1);
    const next=s.turn>=graduationTurn()?'졸업 및 직업 선택':s.turn%12?'2학기 수강 신청':'다음 학년 수강 신청';
    if(term?.endTurn===s.turn){
      return heading('아카데미 성적표',term.year+'학년 '+term.term+'학기 성적표')+semesterBody(term)+(term.term===2?primary('open-year-review','학년 종합 성적표 보기'):primary('next-term',next));
    }
    const year=s.years.at(-1);
    return heading('아카데미 성적표',year.year+'학년 성장 평가')+yearBody(year)+
      button('transcript-'+year.year,'교관 평가 보기')+primary('next-term',next);
  }
  function annualBody(year){
    const annual=academy.annual(s.semesterReports,year,graduationTurn());
    const strongestGrowth=Math.max(...annual.growth);
    const progress=strongestGrowth>0?stats.filter((_,i)=>annual.growth[i]===strongestGrowth).join(' · ')+'에서 가장 큰 성장을 보였습니다.':'이번 학년에는 능력치 변화가 없었습니다.';
    const row=(names,lines)=>'<table class="semester-grades"><thead><tr>'+names.map(name=>'<th scope="col">'+name+'</th>').join('')+'</tr></thead><tbody>'+lines.join('')+'</tbody></table>';
    return '<div class="review-banner"><strong>종합 등급 '+annual.grade+' · 평균 '+annual.average.toFixed(1)+'점</strong><p>'+progress+'</p></div>'+
      (annual.elapsed<12?'<p class="small">기록된 '+annual.elapsed+'개월을 기준으로 집계했습니다.</p>':'')+
      '<dl class="review-metrics"><div><dt>수강 건수</dt><dd>'+annual.results.length+'건</dd></div><div><dt>학기 기록</dt><dd>'+annual.terms.length+'개</dd></div><div><dt>능력치 성장</dt><dd>+'+total(annual.growth)+'</dd></div></dl>'+
      '<section class="folio"><h2>학년 과목별 성적</h2>'+row(['과목','학기','성적'],annual.results.map(result=>
        '<tr><th scope="row">'+result.name+'</th><td>'+result.term+'학기</td><td>'+result.grade+' · '+result.score+'점</td></tr>'))+'</section>'+
      '<section class="folio"><h2>학년 전후 능력치</h2>'+row(['능력치','학년 초','학년 말','변화'],stats.map((stat,i)=>
        '<tr><th scope="row">'+stat+'</th><td>'+annual.before[i]+'</td><td>'+annual.after[i]+'</td><td>+'+annual.growth[i]+'</td></tr>'))+'</section>'+
      '<section class="folio"><h2>'+(annual.remaining?'졸업 전망':'졸업 능력치')+'</h2>'+
      (annual.remaining?'<p class="small">이번 학년과 같은 성장 속도로 남은 '+(annual.remaining/6)+'학기를 마친다고 가정한 수치입니다.</p>':'')+
      '<p class="total-line">능력치 합계 <strong>'+total(annual.projected)+'</strong> · '+(annual.remaining?'예상 강점 ':'강점 ')+
        stats.filter((_,i)=>annual.projected[i]===Math.max(...annual.projected)).join(' · ')+'</p>'+
      row(['능력치','현재',annual.remaining?'졸업 예상':'졸업'],stats.map((stat,i)=>
        '<tr><th scope="row">'+stat+'</th><td>'+annual.after[i]+'</td><td>'+annual.projected[i]+'</td></tr>'))+'</section>';
  }
  function yearReview(){
    const year=s.semesterReports.at(-1).year;
    return heading('아카데미 학년 평가',year+'학년 종합 성적표')+annualBody(year)+
      primary('next-term',s.turn>=graduationTurn()?'졸업 및 직업 선택':'다음 학년 수강 신청');
  }
  function openTranscript(y){
    const values=yearValues(y);
    const index=values.indexOf(Math.max(...values));
    const growth=total(y.growth);
    $('#transcript-title').text(y.year+'학년 교관 평가');
    $('#transcript-content').html('<p><b>'+$escape(s.name)+'</b> · '+elementLabel()+'</p><p>'+stats[index]+'이 현재 가장 높은 능력입니다. 이번 학년 능력치 합계는 '+growth+'점 늘었습니다.</p><h3>관련 진로</h3><p>'+jobs[index].slice(0,3).join(' · ')+'</p>');
    $('#transcript')[0].showModal();
  }
  function career(){
    return heading('아카데미 졸업 · '+age()+'세','첫 직업 선택','주요 능력과 월 기본 수입을 비교하고 첫 진로를 정하세요.')+
      '<div class="review-banner"><strong>졸업 시 가장 높은 능력 · '+strongest(s.values)+'</strong><p>모든 직업을 선택할 수 있습니다.</p></div>'+
      jobs.map((list,i)=>'<details class="folio career-path"><summary>'+stats[i]+' 특화 <b>'+s.values[i]+'</b></summary>'+list.map((name,j)=>button('job-'+i+'-'+j,name,stats[i]+' 성장 · 월 기본 수입 '+(9+i+j)+'은')).join('')+'</details>').join('');
  }
  function bondView(){
    const states=['지인','연인','약혼','배우자'];
    const school=s.stage==='school';
    const known=people.map((p,i)=>({p,i})).filter(({p,i})=>!playerPerson(p)&&s.relations[i]);
    const intro=heading('교우와 가족','인간관계');
    if(!known.length)return intro+'<p class="result">아직 만난 인물이 없습니다. 수업이나 스토리를 진행하면 인연이 생깁니다.</p>';
    const duration=school?'학기당 인물별 1회':'1개월';
    return intro+(s.latest?'<p class="result">'+$escape(s.latest)+'</p>':'')+
      known.map(({p,i})=>{
        const r=s.relations[i];
        const label=r.like>=80?'사랑':r.like>=50?'호감':r.like>=25?'관심':'호기심';
        const romance=s.gender!==p.gender;
        return '<section class="panel"><div class="relationship-profile"><img src="'+portrait(p.gender,p.image)+'" alt="">'+
          '<h2>'+p.name+' · '+(r.bond?states[r.bond]:r.rival?'라이벌':r.trust>=40?'친구':'지인')+'</h2></div><p>'+p.bio+'</p><p>'+label+' '+r.like+'% · 신뢰 '+r.trust+' · 질투 '+r.jealous+'</p>'+
          (school&&s.termSocial.includes(i)?'<p class="small">이번 학기에 교류했습니다.</p>':
            button('talk-'+i,'일상 이야기','호감 및 신뢰 · '+duration)+button('promise-'+i,'약속을 지킨다','신뢰 중심 · '+duration)+
            (!r.bond?button('rival-'+i,r.rival?'라이벌 관계 풀기':'라이벌 관계 맺기','서로의 경쟁 관계 · '+duration):'')+
            (romance&&r.like>=50?button('date-'+i,'함께 산책','호감 +8 · '+duration):'')+
            (romance&&r.bond===0&&r.like>=80&&r.trust>=40?button('confess-'+i,'마음을 전한다','연인 관계 · '+duration):'')+
            (romance&&r.bond===1&&r.like>=93&&r.trust>=55&&age()>=18&&s.spouse===null?button('engage-'+i,'청혼한다','약혼 · 1개월'):'')+
            (r.bond===2&&s.spouse===null?button('marry-'+i,'결혼식을 올린다','배우자 · 1개월'):''))+'</section>';
      }).join('');
  }
  function advantage(attacker,defender){
    if(attacker===defender)return 1;
    return favorableElements[attacker].includes(defender)?1.05:.95;
  }
  function expeditionCost(){
    return expeditionStamina-(academy.remembers(s,'endurance')?4:0);
  }
  function expeditionLessons(mode, matchup){
    return [
      [mode===1&&academy.remembers(s,'mana'),'기초 마력 제어',4],
      [matchup>1&&academy.remembers(s,'elements'),'속성 기초 제어',5],
      [s.floor===2&&academy.remembers(s,'monster'),'몬스터 대응학',8]
    ].filter(([applies])=>applies).map(([,label,power])=>({label,power}));
  }
  function expedition(){
    if(s.floor===7)return heading('별탑 원정','별탑 정복')+button('life','활동으로 돌아가기');
    const id=bossElements[s.floor], a=advantage(s.element,id);
    const eligible=people.map((p,i)=>({p,i})).filter(({i})=>s.relations[i]?.trust>=30);
    return '<div class="hero" style="background-image:url(art/tower.webp)" aria-hidden="true"></div>'+heading('별탑 · '+(s.floor+1)+'층',bosses[s.floor],elements[id]+' 속성 · '+(a>1?'유리':a<1?'불리':'중립')+' · 피해 배율 ×'+a.toFixed(2))+
      '<label for="partner">동료 선택</label><select id="partner"><option value="">혼자 출정</option>'+eligible.map(({p,i})=>'<option value="'+i+'" '+(s.partner===i?'selected':'')+'>'+p.name+'</option>').join('')+'</select><p class="small">2인 파티 보상은 절반을 공동 자금에 적립하고, 나머지 절반을 균등 분배합니다.</p>'+
      (academy.remembers(s,'endurance')?'<p class="small">기초 체력 훈련에서 배운 호흡법으로 원정 스태미나 소모가 4 줄어듭니다.</p>':'')+
      (s.floor===2&&academy.remembers(s,'monster')?'<p class="result">몬스터 대응학에서 배운 대로, 천둥의 추적자가 발톱으로 땅을 긁으면 돌진이 시작됩니다.</p>':'')+
      combatSkills.map((skill,i)=>{
        const lessons=expeditionLessons(i,a).map(({label,power})=>label+' +'+power);
        return button('fight-'+i,skill.category+' · '+skill.name,
          [...skill.stats.map(index=>stats[index]),'스태미나 '+expeditionCost(),'1개월',...lessons].join(' · '));
      }).join('')+button('life','돌아가기');
  }
  function titleList(){
    return achievements.filter(([,test])=>test(s)).map(([label])=>label);
  }
  function characterStats(){
    return '<h2>기본 능력치</h2>'+statView(s.values)+
      '<h2>재산</h2><p>소지금 '+money(s.money)+' · 파티 공동 자금 '+money(s.partyFunds)+'</p>'+
      '<h2>달성한 인생 목표</h2><p>'+(titleList().join(' · ')||'진행 중')+'</p>'+
      (s.house?'<p>가문 · '+$escape(s.house)+'</p>':'')+(s.spouse!==null?'<p>배우자 · '+people[s.spouse].name+' · 가족 추억 '+s.family+'회</p>':'');
  }
  function characterEquipment(){
    const tier=s.equipment;
    return '<h2>현재 장비</h2><div class="character-item"><span class="character-icon" aria-hidden="true">⬡</span>'+
      '<div><h3>'+groups[tier]+' 등급</h3><p>별탑 원정 전력 +'+gearPower(tier)+'</p></div></div>'+
      '<h2>장비 등급</h2><ol class="equipment-ranks">'+groups.map((name,i)=>
        '<li'+(i===tier?' aria-current="true"':'')+'>'+name+(i===tier?' <small>현재</small>':'')+'</li>').join('')+'</ol>'+
      (s.stage==='school'||s.stage==='career'?'<p class="character-note">졸업 후 생활 메뉴에서 장비를 강화할 수 있습니다.</p>':
        tier===groups.length-1?'<p class="character-note">최고 등급 장비를 갖췄습니다.</p>':
        '<p class="character-note">다음 등급 '+groups[tier+1]+' · 강화 비용 '+money((tier+1)*5000)+'</p>');
  }
  function skillTrainingText({skill,previous,level}){
    const name=academy.skills[skill].name;
    return previous?name+' 숙련 Lv.'+previous+' → Lv.'+level:name+' 습득 · Lv.'+level;
  }
  function advanceSkill(skill){
    const level=Math.min(academy.maxSkillLevel,(s.skills[skill]??0)+1);
    s.skills[skill]=level;
    return level;
  }
  function currentSkillPracticeTerm(){
    return Math.floor(s.turn/6);
  }
  function canTrainSkill(skill){
    const level=s.skills[skill];
    return Object.hasOwn(academy.skills,skill)&&level>0&&level<academy.maxSkillLevel&&
      (s.stage==='adult'||(s.stage==='school'&&s.lastSkillPracticeTerm!==currentSkillPracticeTerm()));
  }
  function trainSkill(skill){
    if(page!=='record'||!canTrainSkill(skill))return;
    if(s.stage==='adult'&&!effort(skillPracticeStamina))return;
    const previous=s.skills[skill];
    const level=advanceSkill(skill);
    const message=skillTrainingText({skill,previous,level});
    if(s.stage==='school'){
      s.lastSkillPracticeTerm=currentSkillPracticeTerm();
      schoolEvent(message);
    }else{
      monthPass(message);
    }
    if(page==='record')selectCharacterTab($('#character-tab-skills')[0]);
    report(message);
  }
  function characterSkills(){
    const trainingGuide=s.stage==='school'?
      (s.lastSkillPracticeTerm===currentSkillPracticeTerm()?'이번 학기 개인 수련을 마쳤습니다.':'학기마다 개인 수련을 한 번 할 수 있습니다.'):
      s.stage==='adult'?'개인 수련은 1개월이 걸리고 스태미나 '+skillPracticeStamina+'를 소모합니다.':'';
    const learned=Object.entries(s.skills).filter(([skill,level])=>Object.hasOwn(academy.skills,skill)&&level>0);
    return '<h2>배운 기술</h2>'+
      (learned.length?
        (trainingGuide?'<p class="character-note">'+trainingGuide+'</p>':'')+
        '<ul class="character-skills" role="list">'+learned.map(([id,level])=>{
          const skill=academy.skills[id];
          return '<li class="character-item"><span class="character-icon" aria-hidden="true">'+(skill.major==='sword'?'⚔':'✦')+'</span>'+
            '<div><h3>'+skill.name+' · Lv.'+level+'</h3><p>'+skill.detail+'</p>'+
            (canTrainSkill(id)?button('train-skill-'+id,skill.name+' 수련'):'')+'</div></li>';
        }).join('')+'</ul>':'<p class="character-note">6학년부터 기술 선택 과목에서 E 이상을 받으면 여기에 기술이 등록됩니다.</p>')+
      '<h2>별탑 원정 기본 행동</h2>'+
      (s.stage==='adult'?(s.floor===bosses.length?'<p class="character-note">별탑 원정을 완료했습니다.</p>':''):
        '<p class="character-note">졸업 후 별탑 원정에서 사용할 수 있습니다.</p>')+
      '<ul class="character-skills" role="list">'+combatSkills.map(skill=>
        '<li class="character-item"><span class="character-icon" aria-hidden="true">'+skill.icon+'</span>'+
        '<div><p class="skill-kind">'+skill.category+(skill.effect?' · '+skill.effect:'')+' · '+skill.range+'</p><h3>'+skill.name+'</h3>'+
        '<p>적용 능력치 '+skill.stats.map(i=>stats[i]).join(' · ')+'<br>소모 스태미나 '+expeditionCost()+'</p></div></li>').join('')+'</ul>';
  }
  function record(){
    const panels=[characterStats,characterEquipment,characterSkills];
    return '<article class="character-sheet"><div class="character-hero"><h1 tabindex="-1">인물정보</h1>'+
      '<div class="character-identity"><img src="'+portrait(s.gender,s.portrait)+'" alt="">'+
      '<div><h2>'+$escape(s.name)+'</h2><p>'+age()+'세 · '+(s.job?s.job.name:'아카데미')+'</p>'+
      '<p>'+elementLabel()+(s.major?' · '+academy.majors[s.major]:'')+'</p><p>스태미나 '+s.stamina+' / 100</p></div></div></div>'+
      '<div class="character-tabs" role="tablist" aria-label="인물정보 항목">'+characterTabs.map(([id,label],i)=>
        '<button type="button" role="tab" id="character-tab-'+id+'" aria-controls="character-'+id+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?0:-1)+'">'+label+'</button>').join('')+'</div>'+
      characterTabs.map(([id],i)=>'<section class="character-panel" id="character-'+id+'" role="tabpanel" aria-labelledby="character-tab-'+id+'" tabindex="0"'+(i===0?'':' hidden')+'>'+panels[i]()+'</section>').join('')+'</article>';
  }
  function selectCharacterTab(tab){
    const $tab=$(tab);
    const $tabs=$tab.parent().children();
    const $panels=$game.find('.character-panel');
    $tabs.attr({'aria-selected':'false',tabindex:'-1'});
    $panels.prop('hidden',true);
    $tab.attr({'aria-selected':'true',tabindex:'0'});
    $('#'+$tab.attr('aria-controls')).prop('hidden',false);
    $tab.trigger('focus');
  }
  function journal(){
    const semesters=s.semesterReports.map(term=>'<details class="folio semester-archive"><summary>'+term.year+'학년 '+term.term+'학기</summary>'+semesterBody(term)+'</details>'+
      (term.term===2?'<details class="folio semester-archive"><summary>'+term.year+'학년 종합 성적표</summary>'+annualBody(term.year)+'</details>':''));
    const years=s.years.map(year=>'<details class="folio"><summary>'+year.year+'학년 · 능력치 +'+total(year.growth)+'</summary>'+
      yearBody(year)+button('transcript-'+year.year,'교관 평가 보기')+'</details>');
    return heading('아르테시아 기록부','생애 일지')+'<p>총 '+s.turn+'개월</p>'+
      (s.story.result?button('story','메인 스토리 결말 보기'):'')+
      (years.length||semesters.length?'<h2>보관된 성적표</h2>'+years.concat(semesters).join(''):'')+
      '<h2>최근 활동</h2><ol class="log">'+[...s.log].reverse().slice(0,36).map(l=>'<li>'+$escape(l)+'</li>').join('')+'</ol>';
  }
  function storyPage(){
    return plot.view(s,{heading,button,primary,escape:$escape,summary:()=>profile()+
      '<section class="story-paper"><h2>생애 기록</h2><p>배우자 '+(s.spouse===null?'없음':people[s.spouse].name)+'</p>'+
      '<p>생애 업적 · '+(titleList().join(' · ')||'일상의 기록')+'</p></section>'});
  }
  function replayPage(){
    return heading('회차 기록','다음 회차를 시작할까요?','이전 결말에서 얻은 기억과 주인공의 입학 설정을 가지고 아카데미에 다시 입학합니다. 현재 회차의 성장과 활동 기록은 초기화됩니다.')+
      primary('story-replay-confirm','같은 인물로 다시 입학')+button('story','이번 회차 결말로 돌아가기');
  }
  function ending(){
    const titles=titleList();
    return heading('100세 · 생애 종합 엔딩',titles.at(-1)||'아르테시아의 한 사람','한 달씩 쌓아 온 선택이 '+$escape(s.name)+'의 생애를 만들었습니다.')+
      profile()+statView(s.values)+'<p>소지금 '+money(s.money)+' · 연구 '+s.research+'건 · 별탑 '+s.floor+'층 · 영향력 '+s.influence+'</p>'+
      '<h2>생애 업적</h2><p>'+(titles.join(' · ')||'일상의 기록')+'</p>'+
      '<p>가문 '+(s.house?$escape(s.house):'미창설')+' · 배우자 '+(s.spouse===null?'없음':people[s.spouse].name)+'</p>'+(s.story.result?button('story','메인 스토리 결말 보기'):'')+button('journal','생애 일지 읽기')+button('intro','표지로 돌아가기');
  }
  function resume(){
    migrateElement();
    if(s.stage==='end'&&s.story.result&&s.story.result!=='true'){goto('story');return;}
    goto({school:'life',adult:'life',career:'life',simulation:'simulation',report:'report','year-review':'year-review',end:'end'}[s.stage]);
  }
  const views={intro,create,life,simulation,report:schoolReport,'year-review':yearReview,relations:bondView,record,journal,expedition,end:ending,story:storyPage,replay:replayPage};
  function render(){
    $('#date').text(s&&page!=='intro'?age()+'세'+(age()===100?'':' · '+month()+'월'):'');
    $('#nav').prop('hidden',!s||!['life','relations','record','journal','expedition','story'].includes(page)||s.stage==='end'||s.stage==='career');
    $('#nav').html([['life','생활'],['relations','관계'],['story','스토리'],['record','인물정보'],['journal','기록']].map(([id,label])=>'<button type="button" data-action="'+id+'" '+(id===page?'aria-current="page"':'')+'>'+label+'</button>').join(''));
    $game.html(views[page]());
    if(storageFailed)$game.prepend('<p class="result">이 브라우저에서 진행을 저장할 수 없습니다.</p>');
  }
  function relationship(action,i){
    const r=s.relations[i], p=people[i];
    const school=s.stage==='school';
    if(!r||s.stage==='career'||(school&&s.termSocial.includes(i)))return;
    if(action==='rival'){
      if(r.bond)return;
      r.rival=!r.rival;
    }
    if(action==='talk'){r.like=clamp(r.like+5);r.trust=clamp(r.trust+3);}
    if(action==='promise'){r.like=clamp(r.like+3);r.trust=clamp(r.trust+8);r.jealous=clamp(r.jealous-8);}
    if(['date','confess','engage','marry'].includes(action)){
      if(p.gender===s.gender)return;
      if(action==='date'&&r.like>=50){r.like=clamp(r.like+8);r.trust=clamp(r.trust+3);}
      else if(action==='confess'&&r.bond===0&&r.like>=80&&r.trust>=40){r.bond=1;r.rival=false;}
      else if(action==='engage'&&r.bond===1&&r.like>=93&&r.trust>=55&&age()>=18&&s.spouse===null)r.bond=2;
      else if(action==='marry'&&r.bond===2&&s.spouse===null){s.spouse=i;r.bond=3;}
      else return;
      s.relations.forEach((other,index)=>{
        if(index!==i&&other&&people[index].gender!==s.gender&&other.like>=65){
          other.jealous=clamp(other.jealous+12);
          if(other.jealous>=60)other.trust=clamp(other.trust-5);
        }
      });
    }
    const event={talk:'와 대화를 나눴다. '+p.gift,promise:'와의 약속을 지켰다.',rival:r.rival?'와 선의의 경쟁을 시작했다.':'와 라이벌 관계를 끝냈다.',date:'와 산책했다.',confess:'에게 고백해 연인이 됐다.',engage:'와 약혼했다.',marry:'와 결혼식을 올렸다.'};
    if(school){s.termSocial.push(i);schoolEvent(p.name+event[action]);}
    else monthPass(p.name+event[action]);
  }
  function fight(mode){
    const skill=combatSkills[mode];
    if(!skill||s.stage!=='adult'||s.floor>=7||!effort(expeditionCost()))return;
    const index=s.floor;
    const skillPower=skill.stats.reduce((sum,stat)=>sum+s.values[stat],0);
    const matchup=advantage(s.element,bossElements[index]);
    const lessons=expeditionLessons(mode,matchup);
    const training=lessons.length?' '+lessons.map(({label})=>label).join(' · ')+' 수업에서 배운 내용을 활용했다.':'';
    const signal=index===2&&academy.remembers(s,'monster')?' 발톱 긁는 소리를 듣고 돌진을 미리 알아챘다.':'';
    const power=(8+skillPower+gearPower(s.equipment)+(s.partner===null?0:10))*matchup+lessons.reduce((sum,lesson)=>sum+lesson.power,0);
    if(power<21+index*11){monthPass(bosses[index]+'에게 밀려 후퇴했다.'+signal+training+' 훈련과 장비로 전력을 높일 수 있다.');return;}
    const reward=1600+index*800;
    s.money+=s.partner===null?reward:reward/4;
    s.partyFunds+=s.partner===null?0:reward/2;
    s.floor++;
    monthPass(bosses[index]+' 격파 · '+money(s.partner===null?reward:reward/4)+' 획득'+signal+training);
  }
  $game.on('click','.character-tabs [role=tab]',function(){selectCharacterTab(this);})
    .on('keydown','.character-tabs [role=tab]',function(e){
      const $tabs=$(this).parent().children();
      const index=$tabs.index(this);
      const targets={ArrowLeft:(index+$tabs.length-1)%$tabs.length,ArrowRight:(index+1)%$tabs.length,Home:0,End:$tabs.length-1};
      if(!Object.hasOwn(targets,e.key))return;
      e.preventDefault();
      selectCharacterTab($tabs.get(targets[e.key]));
    })
    .on('input','#character-name',function(){draft.names[draftPerson()]=this.value;})
    .on('change','#gender',function(){
      draft.gender=this.value;draft.portrait=registrationRoster(draft.gender)[0].image;
      $('.portraits').html(portraitOptions());updateRegistration();
    })
    .on('change','[name=portrait]',function(){draft.portrait=Number(this.value);updateRegistration();})
    .on('change','[name=course]',function(){
      const i=Number(this.value);
      const electiveCount=academy.maxCourses-1;
      if(this.checked&&semesterPicks.length>=electiveCount){
        this.checked=false;
        const message='선택 과목은 '+electiveCount+'개까지 고를 수 있습니다.';
        $('#semester-limit').text(message).prop('hidden',false);
        report(message);return;
      }
      $('#semester-limit').prop('hidden',true);
      semesterPicks=this.checked?[...semesterPicks,i]:semesterPicks.filter(value=>value!==i);
      const count=semesterPicks.length+' / '+electiveCount+'과목 선택';
      $('#semester-count').text(count);
      report(count);
    })
    .on('submit','#semester-form',function(e){
      e.preventDefault();
      if(s.stage!=='school'||page!=='life')return;
      if(semesterPicks.length!==academy.maxCourses-1){
        const message='선택 과목 '+(academy.maxCourses-1)+'개를 골라야 수강을 시작할 수 있습니다.';
        $('#semester-limit').text(message).prop('hidden',false);
        $(this).find('[name=course]:not(:checked)').first().trigger('focus');
        report(message);return;
      }
      startSemester(semesterPicks);
    })
    .on('submit','#major-form',function(e){
      e.preventDefault();
      if(s.stage!=='school'||page!=='life'||s.major||s.turn<academy.majorStart)return;
      const major=$(this).find('[name=major]:checked').val();
      if(!Object.hasOwn(academy.majors,major))return;
      s.major=major;
      say(academy.majors[major]+'을 선택했다.');
      persist();goto('life');
      report(academy.majors[major]+'을 선택했습니다.');
    })
    .on('change','#partner',function(){s.partner=this.value===''?null:Number(this.value);persist();})
    .on('submit','#character',function(e){
      e.preventDefault();
      if(page!=='create')return;
      const name=$.trim($('#character-name').val());
      if(!name){$('#character-name').trigger('focus');report('이름을 한 글자 이상 입력하세요.');return;}
      init({name,gender:draft.gender,portrait:draft.portrait},draft.rolls[draftPerson()]);
    });
  $(document).on('click','[data-action]',function(){
    const id=this.dataset.action;
    if(id==='reroll'&&page==='create'){rerollAttributes(this);return;}
    if(id==='intro'){goto('intro');return;}
    if(['create','restart'].includes(id)){register();return;}
    if(id==='resume'&&s){resume();return;}
    if(!s)return;
    if(/^transcript-\d+$/.test(id)){const y=s.years[Number(id.split('-')[1])-1];if(y)openTranscript(y);return;}
    if(id==='journal'){goto('journal');return;}
    if(id==='story' && (s.story.result || ['school','adult'].includes(s.stage))){goto('story');return;}
    if(id==='story-replay' && s.story.result){goto('replay');return;}
    if(id==='story-replay-confirm' && page==='replay' && s.story.result){replayStory();return;}
    if(!active())return;
    if(s.stage==='simulation'){
      if(page!=='simulation')return;
      if(id==='semester-step')advanceSemester();
      if(id==='semester-finish')finishSemester();
      if(id==='semester-pause'&&s.pendingSemester.shown<s.pendingSemester.months.length){
        const entry=s.pendingSemester;
        entry.paused=!entry.paused;
        $(this).text(entry.paused?'자동 진행 시작':'자동 진행 일시정지');
        report(entry.paused?'학기 진행을 일시정지했습니다.':'학기 진행을 계속합니다.');
        persist();scheduleSemester();
      }
      return;
    }
    if(s.stage==='report'||s.stage==='year-review'){
      if(id==='open-year-review'&&s.stage==='report'){
        const term=s.semesterReports.at(-1);
        if(term?.endTurn===s.turn&&term.term===2){
          s.stage='year-review';persist();goto('year-review');
        }
      }
      if(id==='next-term'){
        s.stage=s.turn>=graduationTurn()?'career':'school';persist();goto('life');
      }
      return;
    }
    if(['life','relations','record'].includes(id)){goto(id);return;}
    if(id.startsWith('train-skill-')){trainSkill(id.slice('train-skill-'.length));return;}
    if(page==='story'&&id.startsWith('plot-')){
      const option=plot.actions(s).find(item=>item.id===id.slice(5));
      if(option){
        const discovery=option.perform();
        const introduction=meet(option.person);
        const message=[discovery||option.title,introduction].filter(Boolean).join(' ');
        if(s.stage==='school')schoolEvent(message);
        else monthPass(message,option.months);
      }
      return;
    }
    const [action,x,y]=id.split('-'), i=Number(x);
    if(action==='job'&&s.stage==='career'){
      const j=Number(y);s.job={name:jobs[i][j],stat:i,wage:(9+i+j)*100};s.stage='adult';s.story.start=s.turn;say(s.job.name+'로 일을 시작했다.');persist();goto('life');return;
    }
    if(s.stage==='career')return;
    if(['talk','promise','rival','date','confess','engage','marry'].includes(action)){relationship(action,i);return;}
    if(id==='rest'&&s.stage==='adult'){s.stamina=clamp(s.stamina+30);s.rests++;monthPass('휴식으로 스태미나를 회복했다.');return;}
    if(s.stage!=='adult')return;
    if(id==='expedition'){goto('expedition');return;}
    if(action==='fight'){fight(i);return;}
    if(id==='work'&&effort(8)){s.career++;s.money+=s.job.wage+Math.floor(s.values[s.job.stat]/10)*100;gain(s.job.stat,1);monthPass(s.job.name+' 업무를 마쳤다.');}
    if(id==='research'&&effort(12)){s.research++;gain(2,2);monthPass('연구 보고서 한 편을 남겼다.');}
    if(id==='politics'&&effort(10)){s.influence+=3;gain(2,1);monthPass('도시 의회에서 지지를 얻었다.');}
    if(id==='house'&&!s.house&&s.money>=5000){s.money-=5000;s.house=s.name+' 가문';monthPass('독립 가문을 창설했다.');}
    if(id==='family'&&s.spouse!==null){s.family++;s.relations[s.spouse].trust=clamp(s.relations[s.spouse].trust+4);monthPass('가족과 새로운 추억을 만들었다.');}
    if(id==='gear'&&s.equipment<5&&s.money>=(s.equipment+1)*5000){s.money-=(s.equipment+1)*5000;s.equipment++;monthPass(groups[s.equipment]+' 장비를 갖췄다.');}
    if(id==='year-rest'){
      const elapsed=freeMonths();
      s.rests+=elapsed;s.stamina=100;monthPass('자유 생활 '+elapsed+'개월을 보냈다.',elapsed);
    }
  });
  render();
});
