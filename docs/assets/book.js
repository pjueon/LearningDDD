/* DDD 학습 교재 런타임
   - 외부 의존 없음. file:// 로 열려도 동작한다 (fetch / module script 미사용)
   - 담당: 목차 사이드바, 화면 넘김, 진행률, 퀴즈 채점, Before/After 탭,
           용어 툴팁, Python 코드 하이라이팅, 진도 저장 */
(function () {
  'use strict';

  /* ── 책 전체 목차 (모든 페이지가 공유하는 단일 진실 원천) ────────── */
  var BOOK = [
    { id: 'ch00', num: '0장', title: '이 교재를 읽는 방법과 한빛몰 이야기', part: '입문', screens: 6, hours: 0.5, ready: true },
    { id: 'ch01', num: '1장', title: '왜 DDD인가: 잘 돌아가는 나쁜 코드', part: '입문', screens: 17, hours: 3.0, ready: true },
    { id: 'ch02', num: '2장', title: '도메인 모델의 최소 단위: Entity와 Value Object', part: '전술적 설계', screens: 14, hours: 2.5, ready: true },
    { id: 'ch03', num: '3장', title: 'Aggregate: 불변식을 지키는 경계', part: '전술적 설계', screens: 16, hours: 3.0, ready: true },
    { id: 'ch04', num: '4장', title: 'Repository: 도메인에서 DB를 밀어내기', part: '전술적 설계', screens: 12, hours: 2.5 },
    { id: 'ch05', num: '5장', title: 'Application Service와 계층 구조', part: '전술적 설계', screens: 13, hours: 2.5 },
    { id: 'ch06', num: '6장', title: 'Domain Service, Factory, 그리고 스냅샷', part: '전술적 설계', screens: 12, hours: 2.5 },
    { id: 'ch07', num: '7장', title: 'Domain Event: 애그리게이트 사이를 잇기', part: '전술적 설계', screens: 13, hours: 2.5 },
    { id: 'ch08', num: '8장', title: '유비쿼터스 언어: 코드와 대화가 같은 말을 쓸 때', part: '전략적 설계', screens: 9, hours: 1.5 },
    { id: 'ch09', num: '9장', title: 'Bounded Context: 하나의 모델은 어디까지 유효한가', part: '전략적 설계', screens: 13, hours: 2.5 },
    { id: 'ch10', num: '10장', title: 'Context Map과 통합 패턴', part: '전략적 설계', screens: 13, hours: 2.5 },
    { id: 'ch11', num: '11장', title: '아키텍처: 계층형에서 헥사고날로', part: '아키텍처·일관성', screens: 13, hours: 2.5 },
    { id: 'ch12', num: '12장', title: '트랜잭션 경계와 결과적 일관성', part: '아키텍처·일관성', screens: 11, hours: 2.0 },
    { id: 'ch13', num: '13장', title: '(선택) CQRS와 이벤트 소싱 맛보기', part: '선택·마무리', screens: 9, hours: 1.5 },
    { id: 'ch14', num: '14장', title: '마무리: DDD를 쓰지 말아야 할 때', part: '선택·마무리', screens: 7, hours: 1.0 },
    { id: 'glossary', num: '부록', title: '용어집', part: '선택·마무리', screens: 1, hours: 0 }
  ];

  /* ── 유비쿼터스 언어 용어집 (툴팁의 원천) ─────────────────────── */
  var TERMS = {
    sku: 'SKU — 재고를 관리하는 최소 단위. 같은 상품이라도 낱개와 박스는 다른 SKU다. "상품"은 카탈로그의 개념, SKU는 재고의 개념이다.',
    allocation: '할당 — 특정 주문을 위해 재고를 잡아두는 것. 물건이 실제로 움직인 것은 아니다.',
    picking: '피킹 — 창고 직원이 로케이션에서 물건을 꺼내는 작업. 출고의 전 단계다.',
    outbound: '출고 — 물건이 창고를 떠나는 것. 배송완료와 다르다.',
    fefo: 'FEFO — First Expired, First Out. 유통기한이 이른 재고를 먼저 내보내는 규칙. 입고 순인 FIFO와 다르다.',
    location: '로케이션 — 창고 안의 보관 위치(예: A동-03-B-12). 같은 SKU가 여러 로케이션에 나뉘어 있을 수 있다.',
    invariant: '불변식 — 언제 확인해도 반드시 참이어야 하는 규칙. 예: "주문 총액은 라인 소계의 합과 같다".',
    domain: '도메인 — 소프트웨어가 다루는 업무 영역 그 자체. 한빛몰의 도메인은 "온라인 판매와 창고 물류"다.',
    anemic: '빈혈 도메인 모델 — 데이터만 들고 있고 행동(규칙)이 없는 객체. 규칙은 전부 서비스 함수에 있다.',
    txscript: '트랜잭션 스크립트 — 하나의 요청을 처음부터 끝까지 절차적으로 처리하는 함수. 단순한 업무에는 충분한 정답이다.',
    aggregate: '애그리게이트 — 함께 일관성을 지켜야 하는 객체 묶음. 바깥에서는 대표(루트)만 만질 수 있다.',
    root: '애그리게이트 루트 — 애그리게이트의 대표 객체. 바깥에서는 오직 이 객체만 참조하고, 이 객체를 통해서만 내부를 바꾼다.',
    eta: 'ETA — 입고 예정일. 공급사가 확정해 준 "이 날 창고에 들어온다"는 날짜. 발주만 하고 날짜가 없는 것은 입고예정이 아니다.',
    ubiquitous: '유비쿼터스 언어 — 업무 담당자와 개발자, 그리고 코드가 모두 같은 뜻으로 쓰는 낱말들.',
    onhand: '실물재고 — 창고에 지금 실제로 있는 수량. 창고팀이 "재고"라고 부르는 것.',
    available: '가용재고 — 실물재고에서 이미 예약된 수량을 뺀 것. 지금 당장 내보낼 수 있는 수량.',
    atp: '판매가능수량(ATP) — 가용재고 + 입고예정 잔량. 주문팀이 "재고"라고 부르는 것. 가용재고와 다른 개념이다.',
    inbound: '입고예정 — 아직 창고에 없지만 들어올 날짜(ETA)가 정해진 물량. 발주만 한 것과는 다르다.',
    promised: '출고 예정일 — 주문 전량이 모여 출고할 수 있게 되는 날. 도착 예정일은 여기에 배송 리드타임을 더한 날이다.',
    batch: '배치 — 한 번에 들어온 물건 묶음. 같은 상품이라도 입고된 날이 다르면 다른 배치다. 유통기한이 배치마다 다르기 때문에 나눠 관리한다.',
    reserved: '예약수량 — 창고에 물건은 있지만 이미 다른 주문이 잡아둔 수량. 팔 수 있는 수량은 실물수량에서 이것을 뺀 값이다.',
    orderline: '주문 라인 — 주문서의 한 줄. 상품 하나에 대해 "무엇을·몇 개·단가 얼마·소계 얼마"를 적은 항목이다. 같은 상품을 3개 사면 라인은 1개(qty=3)다.',
    vo: '값 객체 — 불변이고, 내용이 같으면 같은 것으로 보고, 바꿀 때는 새로 만들어 교체하는 객체. 금액·주소·수량처럼 "숫자처럼 다뤄도 되는" 도메인 개념이다.',
    entity: '엔티티 — 식별자로 같음을 판단하는 객체. 내용이 다 바뀌어도 식별자가 같으면 같은 것이고, 생애 주기를 추적한다.',
    invariantset: '불변식 — 언제 확인해도 참이어야 하는 규칙. 이 교재는 기획 단계에서 번호를 붙여 I1~I22로 관리한다.'
  };

  var STORE_KEY = 'ddd-book:progress';

  /* ── 진도 저장 (file:// 에서는 모든 로컬 페이지가 저장소를 공유하므로
        키에 반드시 접두어를 붙인다) ──────────────────────────────── */
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { /* 저장 못해도 교재는 동작한다 */ }
  }

  /* ── Python 코드 하이라이터 ──────────────────────────────────── */
  var PY_KW = 'False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|' +
              'else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|' +
              'pass|raise|return|try|while|with|yield|match|case';

  var PY_RE = new RegExp(
    '(#[^\\n]*)' +
    '|([fFrRbBuU]{0,2}(?:"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'))' +
    '|(@[A-Za-z_][\\w.]*)' +
    '|\\b(def|class)(\\s+)([A-Za-z_]\\w*)' +
    '|\\b(self|cls)\\b' +
    '|\\b(' + PY_KW + ')\\b' +
    '|\\b(\\d[\\d_]*(?:\\.\\d+)?)\\b',
    'g');

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightPython(src) {
    return esc(src).replace(PY_RE, function (m, com, str, dec, defkw, gap, name, slf, kw, num) {
      if (com) return '<span class="tok-com">' + com + '</span>';
      if (str) return '<span class="tok-str">' + str + '</span>';
      if (dec) return '<span class="tok-dec">' + dec + '</span>';
      if (defkw) return '<span class="tok-kw">' + defkw + '</span>' + gap + '<span class="tok-fn">' + name + '</span>';
      if (slf) return '<span class="tok-self">' + slf + '</span>';
      if (kw) return '<span class="tok-kw">' + kw + '</span>';
      if (num) return '<span class="tok-num">' + num + '</span>';
      return m;
    });
  }

  /* code 안의 텍스트 노드만 색칠한다. 저자가 직접 넣은 <b class="hl"> 같은
     강조 표시를 지우지 않기 위한 방식. */
  function highlightAll(root) {
    var blocks = root.querySelectorAll('pre > code, pre code.python');
    Array.prototype.forEach.call(blocks, function (code) {
      if (code.dataset.hl === 'done' || code.classList.contains('plain')) return;
      var texts = [];
      var walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT, null, false);
      while (walker.nextNode()) texts.push(walker.currentNode);
      texts.forEach(function (t) {
        var span = document.createElement('span');
        span.innerHTML = highlightPython(t.nodeValue);
        t.parentNode.replaceChild(span, t);
      });
      code.dataset.hl = 'done';
    });
  }

  /* ── 용어 툴팁 ──────────────────────────────────────────────── */
  function initTerms(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.term[data-term]'), function (el) {
      var def = TERMS[el.dataset.term];
      if (!def) return;
      el.setAttribute('data-def', def);
      el.setAttribute('tabindex', '0');
    });
  }

  /* ── Before / After 탭 ──────────────────────────────────────── */
  function initTabs(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.tabs'), function (wrap) {
      if (wrap.dataset.init) return;
      var tabs = wrap.querySelectorAll(':scope > .tab');
      if (!tabs.length) return;
      var bar = document.createElement('div');
      bar.className = 'tabbar';
      Array.prototype.forEach.call(tabs, function (tab, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = tab.dataset.label || ('탭 ' + (i + 1));
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(bar.children, function (x, j) { x.classList.toggle('on', i === j); });
          Array.prototype.forEach.call(tabs, function (x, j) { x.classList.toggle('on', i === j); });
        });
        bar.appendChild(b);
        tab.classList.toggle('on', i === 0);
      });
      bar.children[0].classList.add('on');
      wrap.insertBefore(bar, wrap.firstChild);
      wrap.dataset.init = '1';
    });
  }

  /* ── 퀴즈 ───────────────────────────────────────────────────── */
  function initQuiz(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.quiz'), function (quiz, qi) {
      if (quiz.dataset.init) return;
      var answer = parseInt(quiz.dataset.answer, 10);
      var opts = quiz.querySelectorAll('ol.options > li');

      var qn = quiz.querySelector('.qn');
      if (!qn) {
        qn = document.createElement('p');
        qn.className = 'qn';
        qn.textContent = '퀴즈 ' + (qi + 1);
        quiz.insertBefore(qn, quiz.firstChild);
      }

      Array.prototype.forEach.call(opts, function (li, i) {
        if (li.dataset.why) {
          var why = document.createElement('div');
          why.className = 'why';
          why.textContent = li.dataset.why;
          li.appendChild(why);
        }
        li.addEventListener('click', function () {
          if (quiz.classList.contains('done')) return;
          var picked = i + 1;
          li.classList.add('picked', picked === answer ? 'pick-good' : 'pick-bad');
          if (picked !== answer && opts[answer - 1]) {
            opts[answer - 1].classList.add('pick-good', 'picked');
          }
          quiz.classList.add('done');
        });
      });
      quiz.dataset.init = '1';
    });
  }

  /* ── 목차 사이드바 ──────────────────────────────────────────── */
  function buildSidebar(currentId, screenTitles, onJump) {
    var progress = loadProgress();
    var toc = document.createElement('nav');
    toc.id = 'toc';

    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = 'index.html';
    brand.innerHTML = '<b>도메인 주도 설계 첫걸음</b><span>한빛몰로 배우는 DDD</span>';
    toc.appendChild(brand);

    var lastPart = null;
    BOOK.forEach(function (ch) {
      if (ch.part !== lastPart) {
        lastPart = ch.part;
        var p = document.createElement('div');
        p.className = 'part';
        p.textContent = ch.part;
        toc.appendChild(p);
      }
      var done = progress[ch.id] && progress[ch.id].done;
      var label = '<em>' + ch.num + (done ? ' <span class="tick">✓</span>' : '') + '</em>' + ch.title;
      var node;
      if (ch.ready) {
        node = document.createElement('a');
        node.className = 'ch';
        node.href = ch.id + '.html';
      } else {
        node = document.createElement('span');
        node.className = 'ch';
        node.title = '아직 집필 전입니다';
      }
      node.innerHTML = label;
      toc.appendChild(node);

      if (ch.id === currentId) {
        node.classList.add('here');
        if (screenTitles && screenTitles.length) {
          var ol = document.createElement('ol');
          ol.className = 'screens';
          screenTitles.forEach(function (t, i) {
            var li = document.createElement('li');
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = (i + 1) + '. ' + t;
            b.addEventListener('click', function () { onJump(i); });
            li.appendChild(b);
            ol.appendChild(li);
          });
          toc.appendChild(ol);
        }
      }
    });

    document.body.appendChild(toc);

    var toggle = document.createElement('button');
    toggle.id = 'toc-toggle';
    toggle.type = 'button';
    toggle.textContent = '☰';
    toggle.setAttribute('aria-label', '목차 열기');
    toggle.addEventListener('click', function () { document.body.classList.toggle('toc-open'); });
    document.body.appendChild(toggle);

    return toc;
  }

  /* ── 장 페이지 초기화 ───────────────────────────────────────── */
  function initChapter() {
    var chId = document.documentElement.dataset.chapter;
    var idx = -1;
    BOOK.forEach(function (c, i) { if (c.id === chId) idx = i; });
    var meta = BOOK[idx] || { num: '', title: document.title };

    var book = document.getElementById('book');
    var screens = book.querySelectorAll('.screen');
    if (!screens.length) return;

    var titles = Array.prototype.map.call(screens, function (s, i) {
      return s.dataset.title || (i + 1) + '번째 화면';
    });

    var cur = 0;

    var bar = document.createElement('div');
    bar.id = 'progress';
    bar.innerHTML = '<i></i>';
    document.body.appendChild(bar);
    var fill = bar.firstChild;

    var nav = document.createElement('div');
    nav.id = 'nav';
    nav.innerHTML =
      '<button type="button" id="prev">← 이전</button>' +
      '<div class="where"><b>' + meta.num + '</b> · 화면 <b class="cnt"></b></div>' +
      '<button type="button" id="next">다음 →</button>';
    document.body.appendChild(nav);

    var prevBtn = nav.querySelector('#prev');
    var nextBtn = nav.querySelector('#next');
    var cnt = nav.querySelector('.cnt');

    var toc = buildSidebar(chId, titles, function (i) {
      show(i);
      document.body.classList.remove('toc-open');
    });
    var screenItems = toc.querySelectorAll('ol.screens > li');

    function neighbourReady(step) {
      var j = idx + step;
      while (j >= 0 && j < BOOK.length) {
        if (BOOK[j].ready) return BOOK[j];
        j += step;
      }
      return null;
    }
    var prevCh = neighbourReady(-1);
    var nextCh = neighbourReady(1);

    // writeLast=false 이면 이 장의 진도만 남기고 '이어서 읽기' 기준점은 건드리지 않는다.
    // (#s5 같은 딥링크로 특정 화면만 열어볼 때 기준점이 그리로 끌려가는 것을 막는다)
    function remember(writeLast) {
      var p = loadProgress();
      var rec = p[chId] || {};
      rec.screen = cur;
      if (cur === screens.length - 1) rec.done = true;
      p[chId] = rec;
      if (writeLast) p['_last'] = { id: chId, screen: cur };
      saveProgress(p);
    }

    function show(i, silentLast) {
      cur = Math.max(0, Math.min(screens.length - 1, i));
      Array.prototype.forEach.call(screens, function (s, j) {
        s.classList.toggle('is-active', j === cur);
      });
      Array.prototype.forEach.call(screenItems, function (li, j) {
        li.classList.toggle('on', j === cur);
      });
      cnt.textContent = (cur + 1) + ' / ' + screens.length;
      fill.style.width = ((cur + 1) / screens.length * 100) + '%';

      prevBtn.disabled = (cur === 0 && !prevCh);
      nextBtn.disabled = (cur === screens.length - 1 && !nextCh);
      prevBtn.textContent = (cur === 0 && prevCh) ? '← ' + prevCh.num : '← 이전';
      nextBtn.textContent = (cur === screens.length - 1 && nextCh) ? nextCh.num + ' →' : '다음 →';

      window.scrollTo(0, 0);
      remember(!silentLast);
    }

    prevBtn.addEventListener('click', function () {
      if (cur === 0) { if (prevCh) location.href = prevCh.id + '.html#last'; return; }
      show(cur - 1);
    });
    nextBtn.addEventListener('click', function () {
      if (cur === screens.length - 1) { if (nextCh) location.href = nextCh.id + '.html'; return; }
      show(cur + 1);
    });

    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); nextBtn.click(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prevBtn.click(); }
    });

    highlightAll(book);
    initTerms(book);
    initTabs(book);
    initQuiz(book);

    // 시작 화면 결정: #last → 마지막, #s3 → 3번째, 그 외에는 저장된 진도
    var start = 0;
    var hash = location.hash;
    if (hash === '#last') {
      start = screens.length - 1;
    } else if (/^#s\d+$/.test(hash)) {
      start = parseInt(hash.slice(2), 10) - 1;
    } else {
      var saved = loadProgress()[chId];
      if (saved && typeof saved.screen === 'number') start = saved.screen;
    }
    show(start, !!hash);
  }

  /* ── 표지(index.html) 초기화 ────────────────────────────────── */
  function initCover() {
    var progress = loadProgress();
    var list = document.getElementById('toc-list');
    if (list) {
      var lastPart = null;
      BOOK.forEach(function (ch) {
        if (ch.part !== lastPart) {
          lastPart = ch.part;
          var h = document.createElement('div');
          h.className = 'parts';
          h.textContent = ch.part;
          list.appendChild(h);
        }
        var li = document.createElement('li');
        var done = progress[ch.id] && progress[ch.id].done;
        var meta = ch.hours ? (ch.screens + '화면 · ' + ch.hours + '시간') : '';
        var inner =
          '<span class="n">' + ch.num + '</span>' +
          '<span class="t">' + ch.title + (done ? ' <span class="tick">✓</span>' : '') + '</span>' +
          '<span class="meta">' + (ch.ready ? meta : '집필 예정') + '</span>';
        if (ch.ready) {
          li.innerHTML = '<a href="' + ch.id + '.html">' + inner + '</a>';
        } else {
          li.innerHTML = '<span class="off">' + inner + '</span>';
        }
        list.appendChild(li);
      });
    }

    var resume = document.getElementById('resume');
    if (resume) {
      var last = progress['_last'];
      var target = BOOK[0];
      if (last) {
        BOOK.forEach(function (c) { if (c.id === last.id && c.ready) target = c; });
      }
      if (last && target.id === last.id && last.screen > 0) {
        resume.href = target.id + '.html#s' + (last.screen + 1);
        resume.textContent = '이어서 읽기 — ' + target.num + ' 화면 ' + (last.screen + 1);
      } else {
        resume.href = target.id + '.html';
        resume.textContent = '처음부터 읽기 — ' + target.num;
      }
    }

    highlightAll(document);
    initTerms(document);
    initTabs(document);
    initQuiz(document);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.dataset.page === 'cover') initCover();
    else initChapter();
  });
})();
