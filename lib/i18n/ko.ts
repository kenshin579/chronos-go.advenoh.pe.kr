import type { Dict } from './en';

export const ko: Dict = {
  nav: { features: '기능', docs: '문서', github: 'GitHub', pkg: 'pkg.go.dev' },
  hero: {
    badge: '오픈소스 · Go 1.26+ · Redis 6.2+',
    title1: '예약 작업을',
    title2: '모든 인스턴스에서 정확히 한 번만',
    lead: 'chronos-go는 Go를 위한 Redis 기반 분산 태스크 큐·스케줄러입니다 — 타입 안전 태스크, 리더를 선출하는 스케줄러, 크래시 복구, 그리고 Chains & Groups.',
    getStarted: '시작하기',
    github: 'GitHub에서 스타',
  },
  features: {
    eyebrow: '기능',
    title: 'Go 백그라운드 작업에 필요한 모든 것',
    lead: 'asynq의 현대적 대안 — 타입 안전하고, 분산되며, 안정적입니다.',
    more: '자세히',
    items: [
      { icon: 'type-safe', title: '타입 안전 제네릭 API', desc: '태스크 타입을 정의하고 Handler[T]를 등록하세요. interface{} payload도, 수동 unmarshal도 없습니다.', slug: 'tasks-and-handlers' },
      { icon: 'scheduler', title: '분산 스케줄러', desc: 'interval·cron 작업. Redis 리더 선출로 각 트리거를 오직 한 인스턴스만 enqueue합니다.', slug: 'scheduling' },
      { icon: 'reliable', title: '기본으로 안정적', desc: '지수 백오프+지터, XAUTOCLAIM 크래시 복구, 훅이 달린 dead-letter.', slug: 'retries-and-reliability' },
      { icon: 'workflow', title: 'Chains & Groups', desc: '순차 체인과 병렬 그룹, 단계 간 결과 전달까지.', slug: 'chains' },
      { icon: 'cluster', title: 'Redis Cluster 안전', desc: '해시태그 키로 큐를 한 슬롯에 모아 멀티키 Lua가 원자적으로 유지됩니다.', slug: 'redis-cluster' },
      { icon: 'observe', title: '관측성', desc: '메트릭, Inspector API, 그리고 큐·태스크용 chronos CLI.', slug: 'observability' },
    ],
  },
  comparison: {
    eyebrow: '왜 chronos-go인가',
    title: 'chronos-go vs asynq',
    lead: 'asynq은 유지보수 모드입니다. chronos-go는 단순한 모델은 지키고 빈틈을 메웁니다.',
    headAsynq: 'asynq',
    headChronos: 'chronos-go',
    rows: [
      { label: '분산 스케줄러 (run-once)', asynq: '✗', chronos: '✓' },
      { label: '제네릭 타입 안전 태스크', asynq: '✗', chronos: '✓' },
      { label: 'Stream·dead-letter 증가 제한', asynq: '—', chronos: '✓' },
      { label: '장시간 처리 중 unique 락 갱신', asynq: '✗', chronos: '✓' },
      { label: '활발한 유지보수', asynq: 'maintenance', chronos: '✓' },
    ],
  },
  howItWorks: {
    eyebrow: '동작 원리',
    title: '즉시 작업은 Streams, 시간 작업은 ZSET',
    lead: '즉시 작업은 Redis Stream을 타고, 지연·재시도·보관 태스크는 sorted set에 있습니다. forwarder가 도래한 항목을 승격하고, recoverer가 죽은 워커의 태스크를 회수합니다.',
  },
  cta: {
    title: 'chronos-go를 써볼 준비가 되셨나요?',
    lead: '문서를 읽고 Go 서비스에 안정적인 백그라운드 작업을 추가하세요.',
    docs: '문서 읽기',
    github: 'GitHub',
    pkg: 'pkg.go.dev',
  },
  docs: { title: '문서', toc: '이 페이지 목차' },
  footer: { tagline: 'Go를 위한 Redis 기반 태스크 큐·스케줄러.', builtBy: 'Built by' },
};
