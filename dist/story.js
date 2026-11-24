(function ($) {
  'use strict';

  const factions = [
    ['북부 공작가', '국경 수비대의 이상 보고를 대조한다.'],
    ['서부 후작가', '고대 유물의 상단 운송 기록을 제시한다.'],
    ['동부 백작가', '금지 연구에 쓰인 왕실 예산을 추적한다.'],
    ['남부 백작가', '실종 신고와 왕실의 비밀 명령을 대조한다.'],
    ['중앙 정계', '재상과 대신들에게 합법적인 계승 절차를 요청한다.']
  ];
  const kingdoms = [
    ['카디온 왕국', '마력 연구와 결계 지원을 요청한다.'],
    ['벨하임 왕실', '공식 외교 채널을 통해 왕실의 참여를 요청한다.']
  ];
  const cities = [
    ['독립 항구도시', '수송선과 보급 항로를 확보한다.'],
    ['독립 공방도시', '군수품과 결계 장비를 확보한다.']
  ];
  const fieldClues = [
    ['학생 실종 기록', '실종된 학생의 이름만 출석부에서 지워져 있다. 왕실 출입 기록에는 같은 이름이 남아 있다.'],
    ['고대 유물 운송장', '벨하임을 거친 수송품이 왕실 연구동으로 넘어갔다. 수취인 란에는 왕실 인장만 찍혀 있다.'],
    ['마력 이상 관측록', '몬스터가 습격한 지역을 표시하자 아르덴 국경 밖에도 같은 파형이 이어졌다.']
  ];
  const suspectClues = [
    ['비공식 사절의 장부', '벨하임 사절의 통행 경로가 끊긴 지점에서 왕실 연구용 유물의 인계 기록이 시작된다.'],
    ['두 소환 문양의 차이', '카디온 학자가 왕실 문양에 없는 바깥 고리를 확인했다. 그 부분은 벨하임 유적의 문양과 일치한다.']
  ];
  const preparations = [
    ['연합군 집결', '각국 지휘관의 지휘 체계를 정리한다.'],
    ['카디온식 결계 점검', '관측 자료를 바탕으로 연합 마법진을 정비한다.'],
    ['병참로 확보', '독립 도시국가의 보급로를 최종 전선까지 연결한다.']
  ];
  const approaches = [
    ['물리', [0, 1]],
    ['마법', [5, 2]],
    ['유틸', [3, 4]]
  ];
  const statNames = ['힘', '민첩', '지력', '센스', '체력', '마나'];
  const lessons = {
    A: '다음 회차에는 왕실 연구동의 봉인 문서부터 확인하자.',
    B: '왕권 교체 전에 네 귀족 가문과 중앙 정계의 지지를 확보해야 한다.',
    C: '아르덴과 함께할 왕국 한 곳 이상, 독립 도시국가 두 곳의 협력이 필요하다.',
    D: '강림 뒤에는 카센과 고위 마족을 차례로 상대하고, 결전 전에 연합군의 지원을 확보해야 한다.',
    true: '아르덴은 왕권을 안정시키고, 연합은 강림 이후에도 전선을 유지했다.'
  };
  const outcomes = {
    A: ['왕실의 침묵', '왕실 연구의 전모가 밝혀지기 전에 마족이 강림했다. 아르덴은 첫 공세를 버티지 못했고, 왕궁과 함께 사건의 진실이 묻혔다.'],
    B: ['무너진 왕좌', '계승에 반발한 세력이 국경의 지휘권을 거두자 타국 군대가 진입했다. 분열된 아르덴은 왕도를 지키지 못했다.'],
    C: ['홀로 맞은 재앙', '새 국왕은 아르덴의 군대를 모았으나, 고위 마족이 강림한 뒤에는 대륙 규모의 공세를 감당할 수 없었다.'],
    D: ['끝나지 않은 재앙', '고위 마족과의 전쟁에서 연합군은 마지막 전선을 지키지 못했다. 대륙의 재앙은 계속된다.'],
    true: ['아르테시아의 새벽', '카센 대공은 제거됐고, 대륙 연합은 인간 세계에 강림한 고위 마족을 처치했다. 아르테시아는 살아남았다.']
  };

  function create(memory) {
    return {
      round: (memory?.round || 0) + 1,
      memories: [...(memory?.memories || [])],
      start: null,
      clues: [], council: [], kingdoms: [], cities: [], conspiracy: [], preparation: [],
      secret: false, succession: false, culprit: false, arrival: false, kassen: false, result: null
    };
  }

  function finish(story, code, cause) {
    story.result = code;
    story.cause = cause;
    if (!story.memories.includes(code)) story.memories.push(code);
  }

  function deadline(story) {
    return story.start+(story.arrival?32+(story.evacuationRoute?2:0):24);
  }

  function advance(story, turn) {
    if (story.start === null || story.result) return;
    if (!story.arrival && turn >= story.start + 24) {
      story.arrival = true;
      if (!story.succession) finish(story, 'A');
      else if (!allied(story)) finish(story, 'C');
      else return '고위 마족이 강림했다. 대륙 연합이 전선에 집결한다.';
    }
    if (story.arrival && !story.result && turn >= deadline(story)) finish(story, 'D', '전선 방어에 주어진 시간이 끝났다.');
    return story.result ? outcomes[story.result][0] : undefined;
  }

  function allied(story) {
    return story.succession && story.kingdoms.length >= 1 && story.cities.length >= 2;
  }

  function supportCount(story) {
    return story.kingdoms.length + story.cities.length;
  }

  function combatPower(state, index) {
    const attributes = approaches[index][1].reduce((sum, stat) => sum + state.values[stat], 0);
    return attributes + state.equipment * 4 + supportCount(state.story) * 6 +
      state.story.preparation.length * 12 + battleLessons(state,index).reduce((sum,lesson)=>sum+lesson[1],0);
  }

  function battleLessons(state, index) {
    const story=state.story;
    const remembers=id=>$.arkesiaAcademy.remembers(state,id);
    return [
      [index===0&&!story.kassen&&remembers('duel'),'대련 전술',8],
      [index===1&&story.kassen&&story.preparation.includes(1)&&remembers('awakening'),'속성 각성 실습',6],
      [story.preparation.includes(2)&&remembers('survival'),'야전 생존',4],
      [story.preparation.includes(0)&&remembers('maneuvers'),'전장 기동 실습',5],
      [index===2&&story.preparation.includes(2)&&remembers('escort'),'교외 호위 실습',3],
      [index===2&&story.preparation.includes(2)&&!remembers('escort')&&remembers('rescue'),'야전 구호술',3]
    ].filter(([applies])=>applies).map(([,label,bonus])=>[label,bonus]);
  }

  function clueTurns(state) {
    return state.admissionAge===13?[3,24,48]:[24,48,72];
  }

  function actions(state) {
    const story = state.story;
    const options = [];
    const add = (id, title, description, perform, months = 1, person) =>
      options.push({id, title, description, perform, months, person});
    const collect = (prefix, source, list) => source.forEach(([title, description], i) => {
      if (!list.includes(i)) add(prefix+'-'+i, title, description, () => { list.push(i); });
    });

    if (story.result || !['school', 'adult'].includes(state.stage)) return options;
    fieldClues.forEach(([title, clue], i) => {
      if (story.arrival || story.clues.includes(i) || state.turn < clueTurns(state)[i]) return;
      add('clue-'+i, title+' 조사', '사건 기록에 단서를 추가한다.', () => {
        story.clues.push(i);
        return clue;
      }, state.stage==='school'?0:1, [3,0,1][i]);
    });
    if (state.stage !== 'adult') return options;
    const remembers=id=>$.arkesiaAcademy.remembers(state,id);

    if (!story.arrival && !story.secret && story.round > 1 && story.clues.length >= 2) {
      add('secret', '왕실 연구동의 봉인 문서 열람', '수집한 단서로 문서의 정체를 확인한다.', () => { story.secret = true; });
    }
    if (!story.arrival && story.secret && !story.succession) {
      collect('council', factions, story.council);
      if (story.council.length === factions.length) {
        add('succession', '왕위 교체 확정', '귀족 합의와 중앙 정계의 협력을 얻었다.', () => { story.succession = true; });
      } else {
        add('succession', '지금 왕위 교체 강행', '경고: 합의를 잃으면 국경과 행정의 지휘가 분열될 수 있다.', () => finish(story, 'B'));
      }
    }
    if (!story.arrival && story.succession) {
      collect('kingdom', kingdoms, story.kingdoms);
      collect('city', cities, story.cities);
    }
    if (allied(story)) {
      if (!story.arrival) suspectClues.forEach(([title, clue], i) => {
        if (story.conspiracy.includes(i)) return;
        const trail=i===0&&remembers('nightSearch');
        add('conspiracy-'+i, trail?'야간 수색으로 사절의 흔적 추적':title+' 조사',
          trail?'야간 수색에서 배운 수레 자국 추적으로 장부를 당일 확보한다.':'국왕의 연구와 별개의 증거를 찾는다.', () => {
          story.conspiracy.push(i);
          return (trail?'수레바퀴에 붙은 흙을 수색해 사절이 머문 창고를 찾았다. ':'')+clue;
        },trail?0:1);
      });
      if (!story.arrival && !story.culprit && story.conspiracy.length === suspectClues.length) {
        const documented=remembers('fieldReport');
        add('culprit', '증거를 대조해 배후 특정', documented?
          '현장 보고서 작성법에서 익힌 방식으로 확인된 기록을 대조해 배후를 당일 특정한다.':'사절 경로와 소환 문양의 연결을 검증한다.', () => {
          story.culprit = true;
          if(documented)return '사절의 통행 장부와 소환 문양을 대조해 카센 대공을 특정했다.';
        },documented?0:1);
      }
      const preparationDetails=[
        remembers('maneuvers')?'전장 기동 실습의 공동 신호를 써서 각국 부대를 지휘한다. 결전 전력 +5.':null,
        remembers('awakening')?'각성 실습 때 확인한 공명으로 결계를 정비한다. 고위 마족전 마법 전력 +6.':null,
        remembers('survival')?'야전 생존 수업에서 배운 우회로를 열어 보급을 유지한다. 결전 전력 +4.':null
      ];
      preparations.forEach(([title,description],i)=>{
        if(story.preparation.includes(i))return;
        const detail=preparationDetails[i];
        add('prepare-'+i,title,detail||description,()=>{
          story.preparation.push(i);
          return detail?title+'을 마쳤다. '+detail:title;
        });
      });
      if(story.arrival&&!story.evacuationRoute&&remembers('evacuation')){
        add('evacuation-route','위기 대응 기동으로 후퇴로 확보','붕괴한 방어선 뒤로 부상자를 후송한다. 전선 유지 기한 +2개월.',()=>{
          story.evacuationRoute=true;
          return '위기 대응 기동 수업에서 익힌 순서대로 퇴로부터 열었다. 부상자를 후송해 전선 유지 기한이 2개월 늘었다.';
        },0);
      }
      if (story.arrival && story.culprit) {
        const target = story.kassen ? '고위 마족 토벌' : '카센 대공 제거';
        const threshold = story.kassen ? 72 : 52;
        approaches.forEach(([name, attributes], i) => {
          const training=battleLessons(state,i).map(([name,bonus])=>name+' +'+bonus).join(' · ');
          add('battle-'+i, target+' · '+name, attributes.map(stat => statNames[stat]).join('·')+
            ' · 전력 '+combatPower(state, i)+' / 필요 '+threshold+(training?' · '+training:''), () => {
            if (combatPower(state, i) < threshold) {
              finish(story, 'D', target+' 작전의 전력이 부족했다.');
            } else if (story.kassen) {
              finish(story, 'true');
            } else {
              story.kassen = true;
            }
            return training?target+' 전투에서 '+training+' 수업 보너스를 활용했다.':undefined;
          });
        });
      }
    }
    if (!story.arrival) {
      add('watch', '다음 관측일까지 대기', '사건을 조사할 시간이 '+(story.start + 24 - state.turn)+'개월 흐른다.', () => {}, story.start + 24 - state.turn);
    } else if (!story.culprit) {
      add('watch', '남은 기간 전선 지키기', '강림 전에 흑막을 특정하지 못해 추격할 수 없다.', () => {}, deadline(story)-state.turn);
    }
    return options;
  }

  function view(state, ui) {
    const story = state.story;
    const {heading, button} = ui;
    if (story.result) {
      const [title, lead] = outcomes[story.result];
      return heading(story.result === 'true' ? '진엔딩' : '멸망 엔딩 '+story.result, title, lead)+
        (story.cause ? '<p class="result">'+story.cause+'</p>' : '')+
        '<section class="story-paper"><h2>이번 회차의 기록</h2><p>'+lessons[story.result]+'</p></section>'+
        ui.summary()+
        (story.result === 'true' && state.stage !== 'end' ? button('life','전쟁 이후의 삶 이어가기') : '')+
        ui.primary('story-replay','다음 회차 시작')+button('journal','생애 일지 보기')+button('intro','표지로 돌아가기');
    }

    const inSchool = state.stage === 'school';
    const title = inSchool ? '아카데미의 이상 현상' : story.arrival ? '연합군의 전선' : '아르덴의 사건 기록';
    let out = '<div class="story-banner'+(story.arrival ? ' story-banner-war' : '')+'">'+
      heading('메인 스토리 · '+story.round+'회차',title)+'</div>';
    if (!inSchool) {
      const remaining = deadline(story)-state.turn;
      out += '<p class="story-clock">'+(story.arrival ? '연합이 전선을 유지할 수 있는 시간' : '다음 마력 관측일까지')+' <strong>'+remaining+'개월</strong></p>';
    }
    if (state.latest) out += '<p class="result">'+ui.escape(state.latest)+'</p>';
    if (!inSchool && story.round === 1 && !story.arrival) out += '<p class="lede">왕실은 연구동을 봉인했다. 왕도 외곽에서는 밤마다 마력 이상이 보고되고 있다.</p>';
    const options = actions(state);
    out += '<section class="story-actions"><h2>이번에 할 일</h2>'+
      (options.length ? options.map(option=>button('plot-'+option.id, option.title, option.description+(option.months===1?' · 1개월':''))).join('') :
        '<p>'+(inSchool?'학기를 마치면 새로운 사건이 열립니다.':'생활 메뉴에서 시간을 보내면 새로운 사건이 열립니다.')+'</p>')+'</section>';
    if (story.memories.length) {
      out += '<details class="story-paper"><summary>이전 회차의 기억</summary><ul>'+
        story.memories.map(code=>'<li>'+lessons[code]+'</li>').join('')+'</ul></details>';
    }
    const clues = story.clues.map(i=>fieldClues[i]).concat(story.conspiracy.map(i=>suspectClues[i]));
    if (story.secret) clues.push(['국왕의 비밀', '국왕의 허가를 받은 연구진이 마족의 힘을 재현하고 있었다.']);
    if (story.succession) clues.push(['왕위 교체 이후', '왕실 연구동은 폐쇄됐으나 국경 밖의 마력 이상은 계속됐다.']);
    if (story.culprit) clues.push(['벨하임의 카센 대공', '수송 기록과 사절의 장부를 대조한 결과, 마족 강림 계획은 카센 대공에게서 시작됐다.']);
    if (story.arrival) clues.push(['확인된 강림', '카센 대공은 고위 마족을 인간 세계로 불러들였다.']);
    if (story.kassen) clues.push(['카센 대공 제거', '흑막을 제거했다. 이미 강림한 고위 마족은 전선에 남아 있다.']);
    if (story.evacuationRoute) clues.push(['후퇴로 확보', '위기 대응 기동 훈련 덕분에 부상자를 후송하고 전선을 2개월 더 유지할 수 있게 됐다.']);
    out += '<details class="story-paper"><summary>확보한 단서 · '+clues.length+'건</summary>'+
      (clues.length ? '<dl class="story-clues">'+clues.map(([name, body])=>'<div><dt>'+name+'</dt><dd>'+body+'</dd></div>').join('')+'</dl>' :
        '<p>조사한 사건의 단서가 이곳에 기록됩니다.</p>')+'</details>';
    if (story.secret) {
      out += '<details class="story-paper"><summary>왕위 교체 협력 · '+story.council.length+' / '+factions.length+'</summary><ul>'+
        factions.map(([name],i)=>'<li>'+name+' · '+(story.council.includes(i) ? '확보' : '미확보')+'</li>').join('')+'</ul></details>';
    }
    if (story.succession) {
      out += '<details class="story-paper"><summary>대륙 연합 · 왕국 '+(1+story.kingdoms.length)+'곳 / 도시국가 '+story.cities.length+'곳</summary><ul>'+
        '<li>아르덴 왕국 · 참여</li>'+kingdoms.map(([name],i)=>'<li>'+name+' · '+(story.kingdoms.includes(i) ? '참여' : '미확보')+'</li>').join('')+
        cities.map(([name],i)=>'<li>'+name+' · '+(story.cities.includes(i) ? '참여' : '미확보')+'</li>').join('')+'</ul></details>';
    }
    if (allied(story) && !story.arrival) out += '<p class="story-paper">연합 준비 '+story.preparation.length+' / '+preparations.length+'</p>';
    return out;
  }

  $.arkesiaStory = {create, advance, actions, view, deadline, firstClueTurn:state=>clueTurns(state)[0]};
})(jQuery);
