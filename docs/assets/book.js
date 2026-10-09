/* 학습 교재 런타임
   - 외부 의존 없음. file:// 로 열려도 동작한다 (fetch / module script 미사용)
   - 담당: 목차 사이드바, 페이지 넘김, 진행률, 퀴즈 채점, Before/After 탭,
           용어 툴팁, 페이지 참조 링크(이동·돌아가기), 코드 하이라이팅, 진도 저장
   - 교재마다 고쳐야 하는 곳은 아래 [교재별] 다섯 블록뿐이다. 그 밖은 손대지 않는다. */
(function () {
  'use strict';

  /* ── [교재별 1/5] 교재 제목 — 사이드바 머리와 표지에 쓰인다 ──── */
  var TITLE = '도메인 주도 설계 첫걸음';
  var SUBTITLE = '한빛몰로 배우는 DDD';

  /* ── [교재별 2/5] 책 전체 목차 — 모든 페이지가 공유하는 단일 진실 원천 ──
        커리큘럼이 확정되면 이 배열을 그대로 옮겨 적는다.
        screens/hours 는 커리큘럼의 값. part 는 사이드바의 묶음 제목.
        ready:true 인 장만 링크가 되고 "이어서 읽기" 대상이 된다 —
        집필 전 장은 ready 를 빼 두면 목차에 회색으로 남는다. */
  var BOOK = [
    { id: 'ch00', num: '0장', title: '이 교재를 읽는 방법과 한빛몰 이야기', part: '입문', screens: 6, hours: 0.5, ready: true },
    { id: 'ch01', num: '1장', title: '왜 DDD인가: 잘 돌아가는 나쁜 코드', part: '입문', screens: 17, hours: 3.0, ready: true },
    { id: 'ch02', num: '2장', title: '도메인 모델의 최소 단위: Entity와 Value Object', part: '전술적 설계', screens: 14, hours: 2.5, ready: true },
    { id: 'ch03', num: '3장', title: 'Aggregate: 불변식을 지키는 경계', part: '전술적 설계', screens: 16, hours: 3.0, ready: true },
    { id: 'ch04', num: '4장', title: 'Repository: 도메인에서 DB를 밀어내기', part: '전술적 설계', screens: 12, hours: 2.5, ready: true },
    { id: 'ch05', num: '5장', title: 'Application Service와 계층 구조', part: '전술적 설계', screens: 13, hours: 2.5, ready: true },
    { id: 'ch06', num: '6장', title: 'Domain Service, Factory, 그리고 스냅샷', part: '전술적 설계', screens: 12, hours: 2.5, ready: true },
    { id: 'ch07', num: '7장', title: 'Domain Event: 애그리게이트 사이를 잇기', part: '전술적 설계', screens: 13, hours: 2.5, ready: true },
    { id: 'ch08', num: '8장', title: '유비쿼터스 언어: 코드와 대화가 같은 말을 쓸 때', part: '전략적 설계', screens: 9, hours: 1.5, ready: true },
    { id: 'ch09', num: '9장', title: 'Bounded Context: 하나의 모델은 어디까지 유효한가', part: '전략적 설계', screens: 13, hours: 2.5, ready: true },
    { id: 'ch10', num: '10장', title: 'Context Map과 통합 패턴', part: '전략적 설계', screens: 13, hours: 2.5, ready: true },
    { id: 'ch11', num: '11장', title: '아키텍처: 계층형에서 헥사고날로', part: '아키텍처·일관성', screens: 13, hours: 2.5, ready: true },
    { id: 'ch12', num: '12장', title: '트랜잭션 경계와 결과적 일관성', part: '아키텍처·일관성', screens: 11, hours: 2.0, ready: true },
    { id: 'ch13', num: '13장', title: '(선택) CQRS와 이벤트 소싱 입문', part: '선택·마무리', screens: 9, hours: 1.5, ready: true },
    { id: 'ch14', num: '14장', title: '마무리: DDD를 쓰지 말아야 할 때', part: '선택·마무리', screens: 7, hours: 1.0, ready: true },
    { id: 'glossary', num: '부록', title: '용어집', part: '선택·마무리', screens: 1, hours: 0, ready: true }
  ];

  /* ── [교재별 3/5] 용어집 — 툴팁의 원천 ────────────────────────
        본문의 <span class="term" data-term="키">낱말</span> 이 이 표에서 뜻을 찾는다.
        표에 없는 키를 쓰면 툴팁이 조용히 안 나온다(점검 절차의 termsMissing 이 잡는다).
        _smoke 항목은 _smoke.html 이 참조하므로 지우지 않는다. */
  var TERMS = {
    _smoke: '스모크 점검용 항목 — 이 줄은 지우지 않는다.',
    sku: 'SKU — 창고에서 실제로 세고 꺼내는 재고 단위. "상품"은 카탈로그에서 파는 단위, SKU는 재고에서 관리하는 단위로 서로 다르다. 상품과 SKU의 대응 관계는 1:1일 수도, 세트 상품처럼 1:N일 수도, 낱개/박스처럼 N:1일 수도 있다(9장).',
    allocation: '할당 — 특정 주문을 위해 재고를 잡아두는 것. 물건이 실제로 움직인 것은 아니다.',
    picking: '피킹 — 창고 직원이 로케이션에서 물건을 꺼내는 작업. 출고의 전 단계다.',
    outbound: '출고 — 물건이 창고를 떠나는 것. 배송완료와 다르다.',
    fefo: 'FEFO — First Expired, First Out. 유통기한이 이른 재고를 먼저 내보내는 규칙. 입고 순인 FIFO와 다르다.',
    location: '로케이션 — 창고 안의 보관 위치(예: A동-03-B-12). 같은 상품이 여러 로케이션에 나뉘어 있을 수 있다.',
    invariant: '불변식 — 언제 확인해도 반드시 참이어야 하는 규칙. 예: "주문 총액은 라인 소계의 합과 같다".',
    domain: '도메인 — 소프트웨어가 다루는 업무 영역 그 자체. 한빛몰의 도메인은 "온라인 판매와 창고 물류"다.',
    anemic: '빈혈 도메인 모델 — 데이터만 들고 있고 행동(규칙)이 없는 객체. 규칙은 전부 서비스 함수에 있다.',
    txscript: '트랜잭션 스크립트 — 하나의 요청을 처음부터 끝까지 절차적으로 처리하는 함수. 단순한 업무에는 이것으로 충분하다.',
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
    reserved: '예약수량 — 창고에 물건은 있지만 이미 다른 주문이 잡아둔 수량. 실물재고에서 이 수량을 뺀 값이 가용재고다(3장).',
    orderline: '주문 라인 — 주문서의 한 줄. 상품 하나에 대해 "무엇을·몇 개·단가 얼마·소계 얼마"를 적은 항목이다. 같은 상품을 3개 사면 라인은 1개(qty=3)다.',
    vo: '값 객체 — 불변이고, 내용이 같으면 같은 것으로 보고, 바꿀 때는 새로 만들어 교체하는 객체. 금액·주소·수량처럼 "숫자처럼 다뤄도 되는" 도메인 개념이다.',
    entity: '엔티티 — 식별자로 같음을 판단하는 객체. 내용이 다 바뀌어도 식별자가 같으면 같은 것이고, 생애 주기를 추적한다.',
    invariantset: '불변식 — 언제 확인해도 참이어야 하는 규칙. 이 교재는 기획 단계에서 번호를 붙여 I1~I22로 관리한다.',
    repository: '리포지토리 — 애그리게이트를 저장하고 꺼내는 인터페이스. 도메인은 이 인터페이스만 알고, 실제 DB 접근 코드는 이 인터페이스를 구현한 클래스 안에 있다.',
    persignorance: '영속성 무지 — 도메인 객체가 자신이 어떻게 저장되는지(DB인지 메모리인지) 전혀 모르는 상태. 리포지토리 패턴이 만들어 주는 성질이다.',
    dip: '의존성 역전 원칙(DIP) — 도메인(상위 정책)이 인프라(하위 구현)에 의존하는 대신, 인프라가 도메인이 정의한 인터페이스를 향해 의존하도록 방향을 뒤집는 원칙.',
    uow: 'Unit of Work — 한 유스케이스 안에서 여러 애그리게이트에 걸친 변경을 하나의 트랜잭션으로 묶어, 전부 반영되거나 전부 반영되지 않게 만드는 장치.',
    dto: 'DTO(Data Transfer Object) — 행동이 없는, 계층 경계를 넘나들 때 쓰는 데이터 뭉치. 도메인 객체를 그대로 내보내지 않기 위해 쓴다.',
    domainservice: '도메인 서비스 — 특정 엔티티나 값 객체 하나에 속한다고 보기 어려운 업무 규칙을 담는, 상태 없이 도메인 계층에 두는 객체. 응용 서비스와 달리 트랜잭션을 열거나 다른 컨텍스트를 조율하지 않는다.',
    factory: '팩토리 — 여러 단계를 거쳐야 완성되는 객체를 한 번의 호출로 항상 유효한 상태로 만들어 돌려주는 생성 지점.',
    reconstitution: '재구성(reconstitution) — 이미 존재하는 애그리게이트를 저장소에서 그대로 복원하는 것. 새로 만드는 생성과 달리, 생성 시점에만 강제하는 규칙을 다시 적용하지 않는다.',
    domainevent: '도메인 이벤트 — 애그리게이트 안에서 일어난, 이미 확정된 업무적 사실. 이름은 과거형이고, 구독자가 그 사실을 취소할 수 없다.',
    messagebus: 'MessageBus — 도메인 이벤트를 구독·발행하는 장치. 이벤트 타입마다 여러 핸들러가 붙을 수 있고, 발행하는 쪽은 누가 구독하는지 몰라도 된다.',
    shipstart: '출고시작 — 창고가 피킹에 착수해, 이후로는 취소 대신 반품으로만 처리되는 시점(I5). Order 상태가 출고준비로 바뀌는 순간과 같다.',
    shiptarget: '출고 대상 — (폐기된 표현) 결제완료 상태에 도달해 앞으로 출고될 주문 전체를 가리키던 개발팀의 구두 표현. 정작 코드에는 이 이름이 없었다. 8장에서 폐기하고 "결제완료 상태"라는 공식 이름을 쓰기로 했다.',
    boundedcontext: '바운디드 컨텍스트 — 하나의 모델과 그 낱말들이 정확히 한 가지 뜻으로만 통하는 범위. 같은 낱말(재고, 상품, 출고)이 컨텍스트가 다르면 다른 것을 가리킬 수 있다. 마이크로서비스와는 다른 개념이다(9장).',
    contextmap: '컨텍스트 맵 — 바운디드 컨텍스트들과 그 사이의 관계를 한 장의 그림으로 나타낸 것. 어떤 컨텍스트가 어떤 컨텍스트에 의존하는지, 그 관계가 어떤 종류인지를 보여준다(10장).',
    partnership: '파트너십 — 두 팀이 서로의 성공에 함께 책임을 지고, 정해진 절차 없이 필요할 때마다 조율하며 함께 바꿔 가는 관계. 같은 팀이거나 협업이 잦을 때 자연스럽게 생긴다.',
    customersupplier: '고객/공급자(Customer-Supplier) — 다운스트림(고객)의 요구사항이 업스트림(공급자)의 계획에 반영되는 관계. 힘의 우열은 있지만 대화로 조율한다.',
    conformist: '순응자(Conformist) — 업스트림의 모델을 다운스트림이 협상 없이 그대로 받아들이는 관계. 외부 업체처럼 우리 요구를 반영할 권한이나 동기가 없는 상대와 통합할 때 흔하다.',
    separateways: '분리된 방법(Separate Ways) — 두 컨텍스트를 아예 통합하지 않기로 하는 선택. 통합 비용이 얻는 이익보다 클 때, 중복을 감수하고 서로 무관하게 둔다.',
    sharedkernel: '공유 커널(Shared Kernel) — 두 컨텍스트가 코드나 모델의 일부를 공유하는 관계. 중복은 줄지만, 공유된 부분을 바꿀 때마다 양쪽 팀이 함께 조율해야 한다.',
    ohs: '개방 호스트 서비스(OHS) — 업스트림이 다운스트림 하나하나에 맞추는 대신, 여러 소비자가 함께 쓸 수 있는 표준화된 인터페이스 하나를 제공하는 것.',
    publishedlanguage: '발행된 언어(Published Language) — 컨텍스트 사이에서 주고받는 데이터의 형식을 문서화된 공용 언어로 정의한 것. 개방 호스트 서비스와 자주 함께 쓰인다.',
    acl: '부패 방지 계층(ACL, Anti-Corruption Layer) — 외부(또는 우리가 통제할 수 없는) 모델을 우리 도메인 언어로 번역해, 상대의 모델이 우리 코드로 새어 들어오지 않게 막는 계층.',
    hexagonal: '헥사고날 아키텍처(포트와 어댑터) — 도메인·응용을 코어로 두고, 표현·인프라를 모두 "바깥"으로 취급해 의존 방향이 모두 안쪽을 향하게 하는 구조. 알리스터 콕번이 2005년에 제안했다. 계층형처럼 "위/아래"로 그리지 않고 "안/밖"으로 그려, 표현 쪽도 인프라 쪽도 같은 규칙을 따른다는 것을 보여준다.',
    port: '포트 — 코어(도메인 + 응용)가 바깥과 주고받기 위해 정의해 둔 인터페이스. 리포지토리·CatalogPort·UnitOfWork가 모두 포트다. 바깥과의 통신을 대표하지 않는 Protocol(예: ShippingFeePolicy)은 포트라 부르지 않는다.',
    adapter: '어댑터 — 포트를 실제로 구현한, 바깥쪽(DB·외부 API·웹 요청)에 닿아 있는 클래스. SqlAlchemyOrderRepository·PgPaymentAdapter가 어댑터다.',
    compositionroot: '합성 뿌리(composition root) — 모든 어댑터의 구체 클래스를 실제로 생성해 포트에 주입하는, 애플리케이션에서 유일하게 인프라 전체를 알아도 되는 지점.',
    onion: '어니언 아키텍처 — 도메인 모델을 가장 안쪽 동심원에 두고, 바깥 원으로 갈수록 인프라에 가까워지는 그림. 제프리 팔레르모가 2008년에 제안했다. 헥사고날(포트와 어댑터)과 같은 의존성 방향 규칙을 다른 모양으로 그린 것이다.',
    cleanarchitecture: '클린 아키텍처 — 로버트 마틴이 정리한, 의존성이 항상 안쪽을 향해야 한다는 "의존성 규칙(Dependency Rule)"을 강조하는 동심원 그림. 헥사고날·어니언과 핵심 아이디어가 같다.',
    optimisticlock: '낙관적 락(Optimistic Lock) — 데이터를 읽을 때는 잠그지 않고, 쓸 때가 돼서야 그 사이 다른 트랜잭션이 바꾸지 않았는지 확인하는 방식. 보통 버전 컬럼으로 확인하고, 충돌이 나면 실패시켜 재시도로 넘긴다. 충돌이 드물 때 유리하다(12장).',
    pessimisticlock: '비관적 락(Pessimistic Lock) — 데이터를 읽는 순간부터 잠가서, 다른 트랜잭션이 같은 행을 고치지도, 잠금을 거는 읽기(SELECT ... FOR UPDATE)도 못하게 막는 방식. 충돌을 아예 못 일어나게 하지만, 잠긴 동안 다른 트랜잭션은 기다려야 해 동시 처리량이 준다(12장).',
    saga: '사가(Saga) — 여러 트랜잭션에 걸쳐 진행되는 하나의 업무 흐름. 중간 단계가 실패하면 데이터베이스의 자동 ROLLBACK이 아니라, 이미 끝난 앞 단계를 되돌리는 보상 트랜잭션을 직접 실행해야 한다(12장).',
    processmanager: '프로세스 매니저(Process Manager) — 사가의 진행 상태를 한 객체가 관리하면서 다음 단계를 지시하는 조정자. 이벤트가 다음 이벤트를 낳는 코레오그래피 방식과 대비된다(12장).',
    eventualconsistency: '결과적 일관성(Eventual Consistency) — 변경 직후에는 관련 데이터가 서로 맞지 않을 수 있지만, 합의한 시간 안에는 일치하게 되는 것을 허용하는 방식. "즉시 일관성"과 대비되며, 그 허용 시간은 관계마다 따로 협상해야 한다(12장).',
    cqrs: 'CQRS(Command Query Responsibility Segregation) — 쓰기(커맨드)와 읽기(쿼리)가 같은 모델을 거칠 필요가 없다는 아이디어. 버트런드 마이어의 CQS(메서드 수준 분리) 원칙을 그렉 영이 모델 수준으로 확장했다. 같은 DB에서 읽기 전용 쿼리 객체를 쓰는 최소 형태부터, 별도로 동기화되는 읽기 테이블까지 단계가 있다(13장).',
    eventsourcing: '이벤트 소싱(Event Sourcing) — 현재 상태를 테이블에 저장하는 대신, 상태에 이르기까지 일어난 사실(이벤트)의 순서를 저장하고 현재 상태는 그 로그를 재생(replay)해 얻는 방식. 완전한 감사 추적과 시간을 되돌린 조회를 얻는 대신, 모든 읽기에 별도의 읽기 모델이 필요해지고 이벤트 스키마 관리 비용이 든다(13장).',
    coredomain: '핵심 도메인(Core Domain) — 이 회사가 다른 회사와 달라지는 지점. 잘하면 돈을 벌고 못하면 고객이 떠나는 곳이라, 애그리게이트·리포지토리 등 이 교재의 모든 패턴을 충분히 들여 적용할 가치가 있다(14장).',
    supportingsubdomain: '지원 하위 도메인(Supporting Subdomain) — 핵심 도메인을 돌아가게는 해야 하지만 그 자체가 경쟁력은 아닌 영역. 직접 만들되 핵심만큼 정교한 설계를 들이지 않는다(14장).',
    genericsubdomain: '일반 하위 도메인(Generic Subdomain) — 어느 회사에나 있고 이미 잘 만들어진 상용품이 있는 영역. 로직 자체는 사거나 외부 서비스를 쓰고, 그 경계(포트·ACL)만 직접 만든다(14장).'
  };

  /* ── [교재별 3/5 이어서] 불변식 번호 — 번호 툴팁의 원천 ──
        본문 텍스트의 I1~I22 를 찾아 이 뜻을 툴팁으로 단다(마크업 불필요).
        번호를 다른 뜻으로 쓰는 일이 생기면 그 자리를 <code> 로 감싸면 건너뛴다. */
  var RULES = {
    I1: 'I1 · Order — 주문 라인이 최소 1개 있어야 한다.',
    I2: 'I2 · Order — 주문 총액 = Σ(라인 소계) − 할인액 + 배송비. 항상 성립해야 한다.',
    I3: 'I3 · Order — 라인 수량은 1 이상이다.',
    I4: 'I4 · Order — 결제완료 이후에는 라인을 추가·삭제·수량변경할 수 없다.',
    I5: 'I5 · Order — 주문 취소는 출고시작(상태가 출고준비가 되는 시점) 전까지만 가능하다. 그 이후는 반품이다.',
    I6: 'I6 · Order — 주문 시점의 상품명·판매가는 스냅샷으로 복사한다. 카탈로그 가격이 바뀌어도 과거 주문 금액은 변하지 않는다.',
    I7: 'I7 · InventoryItem — 가용재고 = 실물재고 − 예약수량. 항상 성립한다(창고 배치만 센다).',
    I8: 'I8 · InventoryItem — 예약수량은 해당 배치의 수량을 넘을 수 없다.',
    I9: 'I9 · InventoryItem — 어떤 수량도 음수가 될 수 없다.',
    I10: 'I10 · InventoryItem — 창고 배치 안에서의 할당은 유통기한이 가장 이른 것부터(FEFO). 유통기한이 지난 배치에는 할당할 수 없다.',
    I11: 'I11 · PickingOrder — 모든 라인이 피킹 완료되기 전에는 출고 처리할 수 없다.',
    I12: 'I12 · PickingOrder — 피킹수량은 지시수량을 넘을 수 없다.',
    I13: 'I13 · PickingOrder — 결번 처리(로케이션에 물건이 없음)된 라인은 다른 로케이션으로 재지시해야 한다.',
    I14: 'I14 · Payment — 환불 누계는 승인 금액을 넘을 수 없다.',
    I15: 'I15 · Payment — 승인되지 않은 결제는 환불할 수 없다.',
    I16: 'I16 · Product — 판매가는 0 이상이다.',
    I17: 'I17 · Product — 판매중지 상품은 신규 주문에 담을 수 없다. 기존 주문은 유효하다.',
    I18: 'I18 · InventoryItem — 창고 배치는 eta 없이 received_on 이 있고, 입고예정 배치는 그 반대다. 둘 다 있거나 둘 다 없는 배치는 없다.',
    I19: 'I19 · InventoryItem — 할당 우선순위는 창고 배치 전체가 입고예정 배치보다 앞선다. 창고 배치끼리는 FEFO, 입고예정 배치끼리는 ETA가 이른 순.',
    I20: 'I20 · InventoryItem — 판매가능수량(ATP) = 가용재고 + 입고예정 잔량. 가용재고와 다른 개념이며 섞어 쓰지 않는다.',
    I21: 'I21 · InventoryItem — 할당 결과에는 출고 준비 완료일이 함께 나온다. 분할 출고를 하지 않으므로 할당된 배치들의 ETA 중 가장 늦은 날이다(창고 배치는 오늘).',
    I22: 'I22 · Order — 고객에게 약속한 출고 예정일도 스냅샷이다. 입고예정일이 바뀌어도 조용히 따라 바뀌지 않고, 바꾸려면 repromise()라는 명시적 재조정과 고객 통지가 필요하다.'
  };
  /* 번호가 처음 정의되는 장 — 그보다 앞 장에서 만나면 뜻 대신 안내 문구를 보인다 */
  var RULE_INTRO = { I2: 2, I3: 2, I17: 2 };
  function ruleDef(key, chNum) {
    var at = RULE_INTRO[key] || 3;
    if (chNum == null || chNum >= at) return RULES[key];
    return key + ' · ' + at + '장에서 정하는 불변식입니다.';
  }

  /* ── [교재별 4/5] 진도 저장 키 — 교재 슬러그를 접두어로 둔다 ─────
        file:// 에서는 로컬로 열린 모든 페이지가 저장소를 공유하므로,
        접두어가 겹치면 다른 교재의 진도를 덮어쓴다. 아래 세 키의 접두어를 함께 바꾼다. */
  var STORE_KEY = 'ddd-book:progress';
  var NAV_KEY = 'ddd-book:nav';     // '다음 장'으로 넘어왔는지 (sessionStorage)
  var BACK_KEY = 'ddd-book:back';   // 다른 장의 참조 링크를 누른 자리 (sessionStorage)

  /* ── 진도 저장 (file:// 에서는 모든 로컬 페이지가 저장소를 공유하므로
        키에 반드시 접두어를 붙인다) ──────────────────────────────── */
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { /* 저장 못해도 교재는 동작한다 */ }
  }

  /* ── [교재별 5/5] 코드 하이라이터 키워드 ──────────────────────
        기본은 Python. 다른 언어면 이 목록만 교체한다.
        한 교재에 언어가 둘이면 합집합으로 둔다 — 오탐이 조금 늘지만 충분하다.
        주석·문자열 표기 자체가 다른 언어(슬래시 두 개로 주석을 여는 계열 등)는
        아래 PY_RE 의 첫 두 그룹도 함께 고쳐야 한다. */
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

  /* 말풍선은 body 에 하나만 두고 화면 안에 들어오게 자리를 잡는다.
     마우스를 올리거나, 탭(포커스)하면 뜨고, 벗어나거나 Esc 를 누르면 닫힌다. */
  var tip = null, tipFor = null;
  function showTip(el) {
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'tip';
      tip.setAttribute('role', 'tooltip');
      document.body.appendChild(tip);
    }
    tip.textContent = el.getAttribute('data-def');
    tip.classList.add('on');
    tipFor = el;
    var r = el.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.max(8, Math.min(r.left, vw - w - 8));
    var top = r.bottom + 6;
    if (top + h > vh - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() {
    if (tip) tip.classList.remove('on');
    tipFor = null;
  }
  function initTip() {
    function termOf(e) { return e.target.closest ? e.target.closest('.term[data-def]') : null; }
    document.addEventListener('mouseover', function (e) { var t = termOf(e); if (t) showTip(t); });
    document.addEventListener('mouseout', function (e) {
      var t = termOf(e);
      if (t && t === tipFor && !t.contains(e.relatedTarget) && document.activeElement !== t) hideTip();
    });
    document.addEventListener('focusin', function (e) { var t = termOf(e); if (t) showTip(t); });
    document.addEventListener('focusout', function (e) { if (termOf(e) === tipFor) hideTip(); });
    window.addEventListener('scroll', hideTip, true);
    window.addEventListener('resize', hideTip);
  }

  /* ── 불변식 번호 툴팁, 페이지 참조 링크 ──────────────────────
     본문 텍스트에서 "N장 페이지 M", "페이지 N", I 번호를 찾아 바꾼다.
     코드, 이미 링크인 곳, kicker, 그림 안은 건드리지 않는다.
     링크로 만들고 싶지 않은 자리는 <code> 로 감싸면 건너뛴다. */
  var REF_RE = /(\d{1,2})장 페이지 (\d{1,2})((?:\s?[·,~]\s?\d{1,2})*)|페이지 (\d{1,2})(?!\d|개|페이지)((?:\s?[·,~]\s?\d{1,2})*)|(^|[^A-Za-z0-9_.])(I2[0-2]|I1\d|I[1-9])(?![0-9A-Za-z_]|\.\d)/g;
  var SKIP_SEL = 'pre, code, a, button, svg, .kicker, .term, .cap, script, style, #tip';

  function chapterOf(num) {
    var id = 'ch' + (num < 10 ? '0' : '') + num;
    for (var i = 0; i < BOOK.length; i++) if (BOOK[i].id === id && BOOK[i].ready) return BOOK[i];
    return null;
  }

  function linkRefs(root, chId, screenCount) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !/페이지 \d|I\d/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        return n.parentNode.closest(SKIP_SEL) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    }, false);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var chNum = /^ch\d+$/.test(chId) ? parseInt(chId.slice(2), 10) : null;  // 용어집은 제한 없음

    nodes.forEach(function (node) {
      var text = node.nodeValue, frag = document.createDocumentFragment(), last = 0, m, changed = false;
      REF_RE.lastIndex = 0;
      function put(s) { if (s) frag.appendChild(document.createTextNode(s)); }
      // "페이지 4·6", "4장 페이지 2~3" 처럼 이어지는 번호도 하나씩 링크로 만든다
      function putList(prefix, first, tail, make) {
        var a = make(parseInt(first, 10), prefix + first);
        if (!a) return false;
        frag.appendChild(a);
        var re = /(\s?[·,~]\s?)(\d{1,2})/g, t;
        while ((t = re.exec(tail))) {
          put(t[1]);
          var b = make(parseInt(t[2], 10), t[2]);
          if (b) frag.appendChild(b); else put(t[2]);
        }
        return true;
      }
      while ((m = REF_RE.exec(text))) {
        var start = m.index;
        if (m[1]) {
          var ch = chapterOf(parseInt(m[1], 10));
          if (!ch) continue;
          put(text.slice(last, start));
          var sameCh = ch.id === chId;
          putList(m[1] + '장 페이지 ', m[2], m[3] || '', function (n, label) {
            if (n < 1 || n > ch.screens) return null;
            return sameCh ? makeXref(n, label) : makeChRef(ch, n, label);
          });
        } else if (m[4]) {
          if (!screenCount) continue;
          put(text.slice(last, start));
          if (!putList('페이지 ', m[4], m[5] || '', function (n, label) {
            return (n >= 1 && n <= screenCount) ? makeXref(n, label) : null;
          })) put(m[0]);
        } else {
          put(text.slice(last, start) + m[6]);
          var s = document.createElement('span');
          s.className = 'term rule';
          s.textContent = m[7];
          s.setAttribute('data-def', ruleDef(m[7], chNum));
          s.setAttribute('tabindex', '0');
          frag.appendChild(s);
        }
        last = REF_RE.lastIndex;
        changed = true;
      }
      if (!changed) return;
      put(text.slice(last));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function makeXref(n, label) {
    var a = document.createElement('a');
    a.className = 'xref';
    a.href = '#s' + n;
    a.setAttribute('data-screen', n);
    a.textContent = label;
    return a;
  }
  function makeChRef(ch, n, label) {
    var a = document.createElement('a');
    a.className = 'xref xref-ch';
    a.href = ch.id + '.html#s' + n;
    a.textContent = label;
    a.title = ch.num + ' 페이지 ' + n + '(으)로 이동합니다';
    return a;
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
        // 키보드로도 고를 수 있게 한다(Tab 으로 옮기고 Enter·Space 로 고른다)
        li.setAttribute('tabindex', '0');
        li.setAttribute('role', 'button');
        li.addEventListener('keydown', function (e) {
          if (e.target !== li) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
        });
        li.addEventListener('click', function (e) {
          if (e.target.closest && e.target.closest('a, .term')) return;
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
    brand.innerHTML = '<b>' + TITLE + '</b><span>' + SUBTITLE + '</span>';
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

    // 모바일에서 목차를 열면 본문을 막으로 덮고, 막을 누르면 닫는다
    var scrim = document.createElement('div');
    scrim.id = 'toc-scrim';
    scrim.addEventListener('click', function () { document.body.classList.remove('toc-open'); });
    document.body.appendChild(scrim);

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
      return s.dataset.title || (i + 1) + '번째 페이지';
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
      '<div class="where"><b>' + meta.num + '</b> · 페이지 <b class="cnt"></b></div>' +
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
    // (#s5 같은 딥링크로 특정 페이지만 열어볼 때 기준점이 그리로 끌려가는 것을 막는다)
    // 완독(✓)은 직전 페이지에서 '다음'으로 마지막 페이지에 왔을 때만 남긴다.
    function remember(writeLast, finished) {
      var p = loadProgress();
      var rec = p[chId] || {};
      rec.screen = cur;
      if (finished && cur === screens.length - 1) rec.done = true;
      p[chId] = rec;
      if (writeLast) p['_last'] = { id: chId, screen: cur };
      saveProgress(p);
    }

    // 주소의 #sN 을 지금 페이지에 맞춰 두면 새로고침·북마크가 그 페이지로 돌아온다.
    // push=true 이면 기록을 하나 쌓아 브라우저의 뒤로 가기로 돌아올 수 있게 한다.
    function setHash(push) {
      var h = '#s' + (cur + 1);
      try {
        if (push) history.pushState(null, '', h);
        else if (location.hash !== h) history.replaceState(null, '', h);
      } catch (e) { /* file:// 에서 막히는 브라우저가 있어도 페이지 넘김은 동작한다 */ }
    }

    function show(i, silentLast, finished, push) {
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

      // 사이드바의 현재 페이지 항목이 목차 밖으로 밀려나 있으면 보이게 굴린다(본문은 굴리지 않는다)
      var on = screenItems[cur];
      if (on) {
        var top = on.offsetTop, bottom = top + on.offsetHeight;
        if (top < toc.scrollTop + 40 || bottom > toc.scrollTop + toc.clientHeight - 40) {
          toc.scrollTop = top - toc.clientHeight / 3;
        }
      }

      hideTip();
      try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
      setHash(push);
      remember(!silentLast, finished);
    }

    prevBtn.addEventListener('click', function () {
      if (cur === 0) { if (prevCh) location.href = prevCh.id + '.html#last'; return; }
      show(cur - 1);
    });
    nextBtn.addEventListener('click', function () {
      if (cur === screens.length - 1) {
        if (nextCh) {
          // 다음 장은 늘 첫 페이지부터 연다. 차례대로 넘어온 것이므로 '이어서 읽기' 기준점도 옮긴다.
          try { sessionStorage.setItem(NAV_KEY, 'seq'); } catch (e) {}
          location.href = nextCh.id + '.html#s1';
        }
        return;
      }
      show(cur + 1, false, cur + 1 === screens.length - 1);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hideTip(); document.body.classList.remove('toc-open'); return; }
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat || e.defaultPrevented) return;
      var t = e.target;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || (t.closest && t.closest('[role=slider]'))) return;
      // PageUp/PageDown 은 긴 화면을 굴리는 데 쓰이므로 가로채지 않는다
      if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevBtn.click(); }
    });

    highlightAll(book);
    initTerms(book);
    linkRefs(book, chId, screens.length);
    initTabs(book);
    initQuiz(book);
    initTip();

    /* ── 페이지 참조: 같은 장이면 바로 이동하고, 돌아가기 버튼을 띄운다 ── */
    var back = null;
    function showBack(label, onBack) {
      if (!back) {
        back = document.createElement('div');
        back.id = 'xback';
        back.innerHTML = '<a href="#"></a><button type="button" aria-label="돌아가기 버튼 닫기">✕</button>';
        document.body.appendChild(back);
        back.querySelector('button').addEventListener('click', function () { back.classList.remove('on'); });
      }
      var link = back.querySelector('a');
      link.textContent = '← ' + label + '(으)로 돌아가기';
      link.onclick = function (e) { e.preventDefault(); back.classList.remove('on'); onBack(); };
      back.classList.add('on');
    }

    function jumpTo(n) {
      var from = cur;
      show(n - 1, false, false, true);
      showBack('페이지 ' + (from + 1), function () { show(from, false, false, true); });
    }

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.xref');
      if (!a) return;
      if (a.classList.contains('xref-ch')) {
        try { sessionStorage.setItem(BACK_KEY, JSON.stringify({ id: chId, num: meta.num, screen: cur + 1 })); } catch (err) {}
        return;  // 다른 장은 그대로 이동한다
      }
      e.preventDefault();
      e.stopPropagation();
      var n = parseInt(a.getAttribute('data-screen'), 10);
      if (n - 1 !== cur) jumpTo(n);  // 같은 장: 바로 이동하고 돌아가기 버튼을 띄운다
    }, true);

    // 브라우저의 뒤로/앞으로 가기로 #sN 이 바뀌면 그 페이지를 보인다
    window.addEventListener('popstate', function () {
      var m = /^#s(\d+)$/.exec(location.hash);
      if (m) show(parseInt(m[1], 10) - 1);
      if (back) back.classList.remove('on');
    });
    window.addEventListener('hashchange', function () {
      var m = /^#s(\d+)$/.exec(location.hash);
      if (m && parseInt(m[1], 10) - 1 !== cur) show(parseInt(m[1], 10) - 1);
    });
    window.addEventListener('beforeprint', function () {
      Array.prototype.forEach.call(document.querySelectorAll('details.fold'), function (d) { d.open = true; });
    });

    // 시작 페이지 결정: #last → 마지막, #s3 → 3번째, 그 외에는 저장된 진도
    var start = 0;
    var hash = location.hash;
    var seq = false;
    try { seq = sessionStorage.getItem(NAV_KEY) === 'seq'; sessionStorage.removeItem(NAV_KEY); } catch (e) {}
    if (hash === '#last') {
      start = screens.length - 1;
    } else if (/^#s\d+$/.test(hash)) {
      start = parseInt(hash.slice(2), 10) - 1;
    } else {
      var saved = loadProgress()[chId];
      if (saved && typeof saved.screen === 'number') start = saved.screen;
    }
    show(start, !!hash && !seq);

    // 다른 장의 참조 링크로 왔으면 원래 자리로 돌아가는 버튼을 띄운다
    try {
      var from = JSON.parse(sessionStorage.getItem(BACK_KEY) || 'null');
      sessionStorage.removeItem(BACK_KEY);
      if (from && from.id !== chId) {
        showBack(from.num + ' 페이지 ' + from.screen, function () { location.href = from.id + '.html#s' + from.screen; });
      }
    } catch (e) {}
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
        var meta = ch.hours ? (ch.screens + '페이지 · ' + ch.hours + '시간') : '';
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
        resume.textContent = '이어서 읽기 — ' + target.num + ' 페이지 ' + (last.screen + 1);
      } else {
        resume.href = target.id + '.html';
        resume.textContent = '처음부터 읽기 — ' + target.num;
      }
    }

    highlightAll(document);
    initTerms(document);
    initTabs(document);
    initQuiz(document);
    initTip();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.dataset.page === 'cover') initCover();
    else initChapter();
  });
})();
