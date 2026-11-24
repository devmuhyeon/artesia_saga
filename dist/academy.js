(function ($) {
  'use strict';

  const monthsPerTerm = 6;
  const admissionAge = 8;
  const graduationAge = 20;
  const finalTurn = (graduationAge - admissionAge) * 12;
  const maxCourses = 4;
  const talentScoreBonus = 5;
  const awakeningStart = 36;
  const awakeningEnd = awakeningStart + monthsPerTerm;
  const awakeningName = '속성 각성 실습';
  const majorStart = 60;
  const majors = {sword:'검술 전공', magic:'마법 전공'};
  const legacyLessonIds = ['endurance','mana','awakening','elements','duel','survival','monster','nightSearch','evacuation','maneuvers'];
  const yearThemes = [
    '왕국의 예절과 이야기','설화와 고대문자','체력과 마력의 기초','속성 각성과 제어',
    '무기와 마법의 기초','전공 선택과 대련','야영과 수색','현장 기록과 위기 대응',
    '모의 전장과 몬스터 관찰','몬스터 대응과 교전','동료 구조와 생환','모의 의뢰와 졸업 시험'
  ];
  const [strength, dexterity, intellect, sense, health, mana] = [0, 1, 2, 3, 4, 5];
  const skills = {
    riposte:{name:'받아치기',major:'sword',detail:'공격을 흘리고 검을 되돌려 반격하는 검술.'},
    guard:{name:'방패 막기',major:'sword',detail:'방패로 자신의 앞이나 동료의 빈틈을 가리는 기술.'},
    step:{name:'검걸음',major:'sword',detail:'검의 자세를 유지하며 간격과 방향을 바꾸는 보법.'},
    thrust:{name:'검 찌르기',major:'sword',detail:'검끝을 겨눠 상대의 빈틈을 찌르는 검술.'},
    arc:{name:'반달 베기',major:'sword',detail:'부드러운 곡선을 그리며 이어서 베는 검술.'},
    sweep:{name:'돌려베기',major:'sword',detail:'방향을 바꾸면서 짧은 호로 베는 검술.'},
    pommel:{name:'손잡이 타격',major:'sword',detail:'검날을 움직일 공간이 좁을 때 쓰는 근거리 기술.'},
    bolt:{name:'속성탄',major:'magic',detail:'각성한 속성의 마력을 한 점에 모아 날리는 기초 주문.'},
    light:{name:'마법등',major:'magic',detail:'밝기와 범위를 조절할 수 있는 기초 조명 주문.'},
    sense:{name:'마력 감응',major:'magic',detail:'주변에 남은 마력과 그 흐름을 살피는 탐지 주문.'},
    shield:{name:'방호막',major:'magic',detail:'잠깐 동안 시전자나 동료를 보호하는 기초 주문.'},
    ward:{name:'경계 결계',major:'magic',detail:'정해 둔 범위에 접근이 감지되면 알리는 기초 결계.'},
    mark:{name:'빛의 표식',major:'magic',detail:'길과 합류 지점에 작은 빛을 남기는 주문.'},
    signal:{name:'마력 전언',major:'magic',detail:'정해 둔 짧은 신호를 동료에게 보내는 주문.'}
  };
  const maxSkillLevel = 5;
  // A course has growth attributes and can teach a skill.
  const semesters = [
    {id:'etiquette', required:['기본 예절',sense,intellect],
      note:'교관과 동급생에게 인사하고 차례를 지켰다. 낯선 손님을 만나는 날에는 친구에게 먼저 이름을 물었다.',
      electives:[['왕실과 기사단의 문장',intellect], ['교정 지도 읽기',sense,intellect], ['성문 깃발 놀이',sense,dexterity], ['첫 봉인 편지',intellect], ['마도구 그림책',intellect], ['약초원 산책',sense], ['견습생의 장비',strength]]},
    {id:'history', required:['아르덴 왕국사',intellect,sense],
      note:'아르덴을 처음 세운 이들의 이야기를 듣고 옛 왕도 지도를 펼쳐 보았다.',
      electives:[['은화와 시장 놀이',intellect], ['아르덴의 계절 축제',sense], ['나무 방패 꾸미기',strength,intellect], ['그림자 연극 놀이',sense,dexterity], ['교정의 작은 생물',sense], ['돌다리 균형 놀이',dexterity,health], ['왕도의 자장가',sense]]},
    {id:'folklore', required:['아르덴 마법 설화',intellect,sense],
      note:'아르덴에 전해지는 마법과 마도구 이야기를 듣고 인상 깊은 장면을 그림으로 남겼다.',
      electives:[['왕도의 마법 등불',sense], ['옛 지도에 그려진 마물',sense,intellect], ['성탑 종소리 알아듣기',sense], ['왕도 빵 굽기',strength,dexterity], ['작은 활쏘기 놀이',dexterity,sense], ['오솔길의 나무 구별',sense,intellect], ['견습생의 여행 놀이',dexterity,health]]},
    {id:'runes', required:['아르덴 고대문자',intellect,sense],
      note:'옛 비석에서 빛과 문을 뜻하는 글자를 찾아 먹으로 따라 썼다.',
      electives:[['비석의 글자 탁본',sense,intellect], ['왕국의 옛 숫자',intellect], ['마도구 명패 만들기',dexterity,intellect], ['아르덴의 별자리 이야기',intellect,sense], ['기숙사 옷깃 꿰매기',dexterity,sense], ['작은 배와 물길',sense], ['왕도 거래 쪽지',intellect,sense]]},
    {id:'endurance', required:['기초 체력 훈련',health,strength],
      note:'교정을 돌며 일정한 호흡으로 체력을 아끼는 법을 배웠다.',
      electives:[['징검돌 균형 잡기',dexterity,health], ['견습 보호구 손질',strength,dexterity], ['왕실 달력 읽기',intellect], ['향주머니 만들기',sense,dexterity], ['길드의 여러 직업',intellect,sense], ['교정의 새소리 지도',sense,intellect], ['왕도 손님의 말씨',sense,intellect]]},
    {id:'mana', required:['기초 마력 제어',mana],
      note:'교관의 도움을 받아 연습용 수정에 마력을 조금씩 흘려 보내고 정해진 밝기에서 멈췄다.',
      electives:[['마력등 밝히기',mana,sense], ['수정의 반응 관찰',sense,mana], ['여행 일기 쓰기',intellect,sense], ['약초 마른잎 분류',sense,intellect], ['성벽의 도르래',strength,intellect], ['작은 악기 연주',dexterity,sense], ['견습생의 무용',dexterity,health]]},
    {id:'awakening', required:['속성 각성 실습',mana,sense],
      note:'각성석과 결계가 같은 파장에 반응했다. 교관은 그 공명이 결계를 지탱한다고 설명했다.',
      electives:[['생활 마도구 살피기',intellect,sense], ['속성에 반응하는 광석',sense,intellect], ['아르덴의 다리와 나루',intellect,sense], ['교정 정찰 놀이',sense,health], ['어린 궁수의 자세',dexterity,sense], ['우정의 편지 쓰기',sense,intellect], ['갑옷을 만드는 공방',strength,intellect]]},
    {id:'elements', required:['속성 기초 제어',mana,intellect],
      note:'연습용 표적에서 속성이 유리한 순간을 기다렸다가 주문을 쓰는 법을 익혔다.',
      electives:[['속성 표적 맞히기',mana,dexterity], ['생활 속 속성 주문',mana], ['왕도 사절의 인사',sense,intellect], ['가죽 장화 수선',dexterity,strength], ['강가의 약초 채집 기록',sense,intellect], ['물건값과 거스름돈',intellect], ['그림으로 남기는 여행',sense,dexterity]]},
    {id:'weapon', required:['기초 무기술',strength,dexterity],
      note:'훈련용 무기로 기본 자세를 맞추고 상대가 준비됐는지 확인한 뒤 움직였다.',
      electives:[['목검의 기본 자세',strength,dexterity], ['나무 방패 받기',strength,health], ['상단 호위 이야기',intellect,sense], ['별과 방위',sense,intellect], ['아르덴의 식탁 예절',sense,intellect], ['야외의 첫 식사 준비',health,sense], ['마법 광물 알아보기',sense,mana]]},
    {id:'spell', required:['기초 마법술',mana,intellect],
      note:'짧은 마법 신호로 짝에게 준비가 끝났다고 알렸다.',
      electives:[['첫 조명 주문',mana,sense], ['기초 방호 주문',mana,health], ['변경 마을의 풍습',intellect,sense], ['견습생의 몸가짐',sense,dexterity], ['구급 상자의 이름표',sense,intellect], ['마차 균형과 적재',strength,health], ['왕국 축제의 무곡',dexterity,health]]},
    {id:'major', required:['검과 마법의 갈림길',sense,intellect],
      note:'교관이 검술과 마법 수련의 차이를 보여 주고 각 전공의 첫 실습을 안내했다.',
      electives:[['귀족 예절',sense,intellect], ['매력을 가꾸는 법',sense,dexterity], ['길드와 상단의 역사',intellect,sense], ['아르덴의 약용 식물',sense,intellect], ['장인의 공방 체험',strength,dexterity]],
      sword:[['받아치기 입문',dexterity,strength,'riposte'], ['방패 막기 기초',strength,health,'guard']],
      magic:[['속성탄 입문',mana,intellect,'bolt'], ['마법등 시전',mana,sense,'light']]},
    {id:'duel', required:['대련 전술',dexterity,sense],
      note:'교관이 보여 준 벨하임식 검술은 큰 공격 직후 옆구리 방어가 늦었다.',
      electives:[['연회의 좌석과 말씨',sense,intellect], ['왕도 악단과 노래',sense,dexterity], ['길드의 장부 읽기',intellect], ['강과 나루 지도 읽기',intellect,sense], ['기초 지구력 달리기',health,dexterity]],
      sword:[['검걸음의 첫발',dexterity,sense,'step'], ['검끝 찌르기 기초',strength,dexterity,'thrust']],
      magic:[['마력 감응 시전',mana,sense,'sense'], ['방호막 시전',mana,health,'shield']]},
    {id:'survival', required:['야전 생존',health,sense],
      note:'보급로가 끊길 경우를 대비해 물자와 숙영지를 두 갈래로 나누는 훈련을 했다.',
      electives:[['기사단과 마도원의 역사',intellect,sense], ['교우를 대하는 몸가짐',sense,intellect], ['왕도 복식의 기초',sense,dexterity], ['견습 화폐 감정',intellect,sense], ['훈련용 장비 운반',strength,health]],
      sword:[['낮은 자세의 받아치기',dexterity,strength,'riposte'], ['반달 베기 입문',strength,dexterity,'arc']],
      magic:[['정찰용 마법등',mana,sense,'light'], ['기초 경계 결계',mana,intellect,'ward']]},
    {id:'nightSearch', required:['야간 수색',sense,dexterity],
      note:'밤길의 발자국보다 수레바퀴가 남긴 흙 자국이 오래 간다는 것을 실습에서 확인했다.',
      electives:[['귀족가의 문장과 계보',intellect,sense], ['축제 무도 실습',dexterity,sense], ['마도구 공방 견학',intellect,mana], ['견습 장신구 세공',dexterity,sense], ['아르덴의 별과 전설',intellect,sense]],
      sword:[['짧은 칼의 돌려베기',strength,dexterity,'sweep'], ['방패로 길목 막기',strength,health,'guard']],
      magic:[['빛의 표식 시전',mana,sense,'mark'], ['어둠 속 마력 감응',mana,sense,'sense']]},
    {id:'fieldReport', required:['현장 보고서 작성법',intellect,sense],
      note:'목격자의 이야기와 현장 기록이 다를 때 확인한 사실과 추정을 구분했다.',
      electives:[['왕도 연회 예법',sense,intellect], ['여행 음식과 향신료',sense,health], ['길드 대금 계산',intellect], ['고대 유적 양식',intellect,sense], ['성문 짐수레 운용',strength,health]],
      sword:[['검의 손잡이 타격',strength,dexterity,'pommel'], ['이동하며 찌르기',dexterity,strength,'thrust']],
      magic:[['속성탄 조준 실습',mana,intellect,'bolt'], ['마력 전언의 기초',mana,sense,'signal']]},
    {id:'evacuation', required:['위기 대응 기동',dexterity,sense],
      note:'교관은 방어선이 무너지면 퇴로를 먼저 열고 후송 인원을 확인하라고 강조했다.',
      electives:[['모험가와 의뢰인의 관계',sense,intellect], ['공적인 말과 사과',sense,intellect], ['마석 거래의 기초',intellect,mana], ['장비 재료 비교',intellect,strength], ['개울과 제방의 구조',intellect,sense]],
      sword:[['물러서며 받아치기',dexterity,strength,'riposte'], ['좁은 길의 검걸음',dexterity,sense,'step']],
      magic:[['이동 중 방호막',mana,dexterity,'shield'], ['연무 속 빛의 표식',mana,sense,'mark']]},
    {id:'maneuvers', required:['전장 기동 실습',dexterity,intellect],
      note:'모의 전장에서 서로 다른 부대가 하나의 공통 신호에 맞춰 움직였다.',
      electives:[['아르덴과 이웃 왕국',intellect,sense], ['무도회의 걸음과 인사',dexterity,sense], ['왕도 직물과 염색',sense,dexterity], ['상단의 수익과 손실',intellect], ['약초 정원 관리',sense,health]],
      sword:[['대열의 반달 베기',strength,dexterity,'arc'], ['동료를 가리는 방패술',strength,health,'guard']],
      magic:[['경계 결계의 범위 조절',mana,intellect,'ward'], ['멀리 보내는 마력 전언',mana,sense,'signal']]},
    {id:'ecology', required:['몬스터 생태학',sense,intellect],
      note:'생활 흔적을 지도로 옮겨 몬스터가 둥지를 떠나는 시간과 이동 방향을 예상했다.',
      electives:[['궁정 알현 예절',sense,intellect], ['협상에서 신뢰 얻기',sense,intellect], ['길드 게시판 편집',intellect,sense], ['목조 기구 손질',strength,dexterity], ['소형 마도구 감정',mana,intellect]],
      sword:[['검의 틈새 찌르기',dexterity,strength,'thrust'], ['균형을 되찾는 검걸음',dexterity,health,'step']],
      magic:[['잔향을 읽는 마력 감응',mana,sense,'sense'], ['광량을 낮춘 마법등',mana,sense,'light']]},
    {id:'monster', required:['몬스터 대응학',sense,intellect],
      note:'천둥의 추적자는 돌진 직전에 발톱을 바닥에 긁는다. 안전한 관찰소에서 그 신호를 기록했다.',
      electives:[['왕도 법과 모험가',intellect,sense], ['평판과 첫인상',sense,dexterity], ['분쟁 중재의 기초',sense,intellect], ['야외 화덕 돌보기',health,sense], ['유적 비문 읽기',intellect,sense]],
      sword:[['돌진 받아치기 실습',dexterity,strength,'riposte'], ['방패 너머 손잡이 타격',strength,dexterity,'pommel']],
      magic:[['움직이는 표적에 속성탄',mana,dexterity,'bolt'], ['충격을 견디는 방호막',mana,health,'shield']]},
    {id:'combat', required:['몬스터 전투 실습',dexterity,health],
      note:'인솔 교관이 지켜보는 실습장에서 동료들과 교대하며 소형 몬스터의 움직임에 대응했다.',
      electives:[['토지와 마을 경계',intellect,sense], ['후원자에게 예를 표하는 법',sense,intellect], ['장거리 악기와 가곡',sense,dexterity], ['길드 공제금과 보상',intellect], ['광산의 짐 나르기',strength,health]],
      sword:[['교대 중 돌려베기',strength,dexterity,'sweep'], ['반달 베기 연결 동작',strength,dexterity,'arc']],
      magic:[['교전 소리 속 마력 전언',mana,sense,'signal'], ['기습을 알리는 경계 결계',mana,intellect,'ward']]},
    {id:'rescue', required:['야전 구호술',sense,health],
      note:'동료가 다친 상황을 가정해 구호품과 귀환 경로를 살피고 교관에게 인계했다.',
      electives:[['귀족 간 서신 예법',intellect,sense], ['모험가의 인상 관리',sense,dexterity], ['고대 왕도의 건축',intellect,sense], ['마도구 수리와 견적',intellect,mana], ['원정 식량의 보관',health,sense]],
      sword:[['한 손 방패술',strength,health,'guard'], ['동료와 발맞춘 검걸음',dexterity,health,'step']],
      magic:[['후송로의 빛의 표식',mana,sense,'mark'], ['구조 현장의 마법등',mana,health,'light']]},
    {id:'escape', required:['험지 생환술',health,sense],
      note:'퇴로가 끊긴 유적에서 파티가 모일 위치를 정하고 돌아온 인원을 확인했다.',
      electives:[['공식 석상의 대화',sense,intellect], ['이웃 왕국의 통행세',intellect], ['모험가의 연대기',intellect,sense], ['훈련장 장비 관리',strength,health], ['왕국 초상화와 복식',sense,dexterity]],
      sword:[['벽 가까이서 검 찌르기',strength,dexterity,'thrust'], ['짧은 거리 돌려베기',dexterity,strength,'sweep']],
      magic:[['닫힌 통로의 마력 감응',mana,sense,'sense'], ['통로 입구 방호막',mana,health,'shield']]},
    {id:'mission', required:['실전 모험학',intellect,sense],
      note:'모의 C랭크 의뢰를 맡아 파티 편성부터 현장 판단과 길드 보고까지 연습했다.',
      electives:[['귀족 후원과 길드',intellect,sense], ['설득과 의견 조율',sense,intellect], ['연금 공방의 재료 감정',intellect,mana], ['왕국의 국경 도시',intellect,sense], ['마갑과 가죽의 관리',strength,health]],
      sword:[['호위 의뢰에서 반달 베기',strength,dexterity,'arc'], ['인질 모의전의 손잡이 타격',strength,dexterity,'pommel']],
      magic:[['모의 의뢰에서 속성탄',mana,intellect,'bolt'], ['야영지 경계 결계 운용',mana,intellect,'ward']]},
    {id:'graduation', required:['졸업 시험 : C랭크 의뢰',sense,intellect],
      note:'학생들이 꾸린 파티가 아르덴 모험가 길드에서 실제 C랭크 실종자 수색 의뢰를 받았다.',
      electives:[['졸업 연회 예법',sense,intellect], ['모험가의 품위와 평판',sense,dexterity], ['장비 거래와 흥정',intellect,sense], ['아르덴 바깥의 역사',intellect,sense], ['원정 자금의 분배',intellect]],
      sword:[['길드 실전의 받아치기',dexterity,strength,'riposte'], ['길드 실전의 방패 교대',strength,health,'guard']],
      magic:[['길드 실전의 마력 전언',mana,sense,'signal'], ['길드 실전의 빛의 표식',mana,sense,'mark']]}
  ];

  const grades = [
    [98,'S',7,3], [88,'A',5,2], [78,'B',3,1], [68,'C',2,1],
    [58,'D',1,1], [48,'E',1,0], [0,'F',0,0]
  ];

  function current(turn, major) {
    const year = Math.floor(turn / 12) + 1;
    const term = Math.floor((turn % 12) / monthsPerTerm) + 1;
    const elapsed = monthsPerTerm - turn % monthsPerTerm;
    const lesson = semesters[Math.floor(turn / monthsPerTerm)];
    if (!lesson) return null;
    const branch = Object.hasOwn(majors, major) ? lesson[major] : null;
    const courseList = [lesson.required, ...lesson.electives, ...(branch ?? [])];
    if (lesson.id === 'major' && branch) {
      courseList[0] = [lesson.required[0], ...(major === 'sword' ? [strength,dexterity] : [mana,intellect])];
    }
    const courses = courseList.map(([name,stat,secondary,skill],index)=>({
      name,stat,secondary,skill,required:index===0
    }));
    return {year,term,elapsed,label:year+'학년 '+term+'학기',theme:yearThemes[year-1],courses,lesson};
  }

  function remembers(state, id) {
    return Boolean(state.legacyLessons?.includes(id) || state.semesterReports.some(term=>term.lessonId===id));
  }

  function gradeFor(score) {
    return grades.find(([minimum])=>score>=minimum);
  }

  function simulate(state, picks, random, specialty) {
    const term = current(state.turn, state.major);
    const selected = [...new Set(picks)];
    if (!term || term.courses.length!==8 || selected.length!==maxCourses-1 ||
        selected.some(i=>!Number.isInteger(i)||i<=0||!term.courses[i])) return null;

    const before = [...state.values];
    const after = [...before];
    const difficulty = Math.min(8, term.year - 1);
    const grow = (stat, amount)=>{
      const gain = Math.min(100 - after[stat], amount);
      after[stat] += gain;
      return gain;
    };
    const results = [0,...selected].map(i=>{
      const {name,stat,secondary,required,skill} = term.courses[i];
      const raw = Math.max(0, 45 + Math.round(before[stat] * .32) + random(31) - difficulty);
      const talent = stat === specialty ? talentScoreBonus : 0;
      const ceiling = raw + talent >= 98 && random(100) < 4 ? 100 : 97;
      const score = Math.min(ceiling, raw + talent);
      const [,grade,primaryReward,secondaryReward] = gradeFor(score);
      const gain = grow(stat, primaryReward);
      const secondaryGain = secondary === undefined ? 0 : grow(secondary, secondaryReward);
      const classmate = required ? Math.floor(state.turn / monthsPerTerm) % 8 : undefined;
      return {name,stat,secondary,score,grade,gain,secondaryGain,required,skill,person:classmate,talentBonus:score-Math.min(ceiling,raw)};
    });
    return {
      year:term.year,term:term.term,elapsed:term.elapsed,before,after,results,
      startTurn:state.turn,endTurn:state.turn + term.elapsed,lessonId:term.lesson.id,lessonNote:term.lesson.note
    };
  }

  function annual(reports, year, graduationTurn=finalTurn) {
    const terms = reports.filter(term=>term.year===year);
    const first = terms[0];
    const last = terms.at(-1);
    const results = terms.flatMap(term=>term.results.map(result=>({...result,term:term.term})));
    const elapsed = terms.reduce((sum,term)=>sum+term.elapsed,0);
    const remaining = Math.max(0, graduationTurn-last.endTurn);
    const growth = last.after.map((value,i)=>value-first.before[i]);
    const projected = last.after.map((value,i)=>Math.min(100,Math.round(value+growth[i]*remaining/elapsed)));
    const average = results.reduce((sum,result)=>sum+result.score,0)/results.length;
    const legacy = results.every(result=>result.secondaryGain===undefined);
    const [,grade] = legacy ?
      [[95,'A+'],[88,'A'],[78,'B'],[68,'C'],[58,'D'],[0,'F']].find(([minimum])=>average>=minimum) :
      gradeFor(average);
    return {terms,results,elapsed,remaining,before:first.before,after:last.after,growth,projected,average,grade};
  }

  $.arkesiaAcademy = {
    current, simulate, annual, remembers, admissionAge, graduationAge, finalTurn, maxCourses,
    talentScoreBonus, legacyLessonIds, awakeningStart, awakeningEnd, awakeningName, majorStart, majors, skills, maxSkillLevel
  };
})(jQuery);
