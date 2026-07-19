'use client';

import { useEffect, useState } from 'react';

/**
 * Hero diagram: chronos-go runs in every Kubernetes pod (scheduler + worker).
 * The scheduler (cron/interval) lives in your code; only the pod holding the
 * Redis leader lock enqueues each trigger — the rest stand by. A deterministic
 * dedup key makes the enqueue exactly-once even during a leader hand-off, and
 * any pod's worker then consumes and runs the task.
 */
export function SchedulerDiagram() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <div className="sd-panel">
      <svg viewBox="0 0 600 300" width="100%" role="img" aria-label="chronos-go leader election across Kubernetes pods">
        <defs>
          <linearGradient id="sd-redis" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <filter id="sd-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Kubernetes cluster boundary */}
        <rect x="18" y="24" width="298" height="252" rx="16" fill="#0b1120" fillOpacity="0.5" stroke="#6b7cff" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="7 5" />
        <polygon points="34,34 41,38 41,46 34,50 27,46 27,38" fill="none" stroke="#8ea2ff" strokeWidth="1.6" />
        <text x="50" y="46" fill="#9aa2b3" fontSize="11" fontFamily="system-ui">Kubernetes</text>

        {/* pod 1 (standby) */}
        <rect x="48" y="64" width="200" height="52" rx="11" fill="#12192a" stroke="#ffffff" strokeOpacity="0.10" />
        <text x="62" y="83" fill="#8b93a7" fontSize="11" fontFamily="system-ui">pod 1</text>
        <text x="238" y="83" textAnchor="end" fill="#6b7280" fontSize="10" fontFamily="ui-monospace,monospace">standby</text>
        <rect x="60" y="86" width="130" height="22" rx="7" fill="#141b2b" stroke="#ffffff" strokeOpacity="0.10" />
        <circle cx="74" cy="97" r="6" fill="none" stroke="#6f7690" strokeWidth="1.6" />
        <path d="M74,97 V93 M74,97 L77,99" stroke="#6f7690" strokeWidth="1.4" strokeLinecap="round" />
        <text x="90" y="101" fill="#7f879b" fontSize="11" fontFamily="ui-monospace,monospace">chronos-go</text>

        {/* pod 3 (standby) */}
        <rect x="48" y="196" width="200" height="52" rx="11" fill="#12192a" stroke="#ffffff" strokeOpacity="0.10" />
        <text x="62" y="215" fill="#8b93a7" fontSize="11" fontFamily="system-ui">pod 3</text>
        <text x="238" y="215" textAnchor="end" fill="#6b7280" fontSize="10" fontFamily="ui-monospace,monospace">standby</text>
        <rect x="60" y="218" width="130" height="22" rx="7" fill="#141b2b" stroke="#ffffff" strokeOpacity="0.10" />
        <circle cx="74" cy="229" r="6" fill="none" stroke="#6f7690" strokeWidth="1.6" />
        <path d="M74,229 V225 M74,229 L77,231" stroke="#6f7690" strokeWidth="1.4" strokeLinecap="round" />
        <text x="90" y="233" fill="#7f879b" fontSize="11" fontFamily="ui-monospace,monospace">chronos-go</text>

        {/* pod 2 (leader) */}
        <rect x="44" y="124" width="208" height="60" rx="12" fill="#161f38" stroke="#6366f1" strokeWidth="2" filter="url(#sd-glow)">
          {!reduce && <animate attributeName="stroke-opacity" values="1;0.5;1" dur="2.4s" repeatCount="indefinite" />}
        </rect>
        <text x="60" y="144" fill="#c7d2fe" fontSize="11" fontFamily="system-ui" fontWeight="600">pod 2 · leader</text>
        <rect x="58" y="148" width="140" height="24" rx="8" fill="#6366f1" />
        <circle cx="74" cy="160" r="6" fill="none" stroke="#ffffff" strokeWidth="1.6" />
        <path d="M74,160 V156 M74,160 L77,162" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        <text x="90" y="164" fill="#ffffff" fontSize="11" fontWeight="600" fontFamily="ui-monospace,monospace">chronos-go</text>
        <text x="230" y="142" fill="#fbbf24" fontSize="12">★</text>
        <g transform="translate(236,152)">
          <rect x="0" y="5" width="11" height="8" rx="2" fill="#ffffff" />
          <path d="M2.2,5 V3.4 a3.3,3.3 0 0 1 6.6,0 V5" fill="none" stroke="#ffffff" strokeWidth="1.4" />
        </g>

        {/* Redis DB (outside cluster) */}
        <path d="M457,120 v68 a48,13 0 0 0 96,0 v-68" fill="url(#sd-redis)" />
        <ellipse cx="505" cy="120" rx="48" ry="13" fill="url(#sd-redis)" />
        <ellipse cx="505" cy="120" rx="48" ry="13" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" />
        <text x="505" y="152" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="600" fontFamily="system-ui">Redis</text>
        <text x="505" y="168" textAnchor="middle" fill="#ffffff" fontSize="10" opacity="0.9" fontFamily="system-ui">queue + lock</text>

        {/* enqueue (leader only) */}
        <path d="M252,140 C345,110 405,120 457,140" fill="none" stroke="#6366f1" strokeWidth="2" />
        <path d="M457,140 l-8,-2 3,-7 z" fill="#6366f1" />
        <text x="360" y="112" textAnchor="middle" fill="#aab2ff" fontSize="10.5" fontFamily="ui-monospace,monospace">enqueue ×1</text>

        {/* consume + run */}
        <path d="M457,176 C405,198 345,206 252,180" fill="none" stroke="#d8b4fe" strokeWidth="2" />
        <path d="M252,180 l8,-3 -1,8 z" fill="#d8b4fe" />
        <text x="360" y="210" textAnchor="middle" fill="#d8b4fe" fontSize="10.5" fontFamily="ui-monospace,monospace">worker runs it</text>

        {!reduce && (
          <>
            <circle r="3.4" fill="#a5b4fc">
              <animateMotion dur="2s" repeatCount="indefinite" path="M252,140 C345,110 405,120 457,140" />
            </circle>
            <circle r="3.4" fill="#e9d5ff">
              <animateMotion dur="2s" begin="1s" repeatCount="indefinite" path="M457,176 C405,198 345,206 252,180" />
            </circle>
          </>
        )}
      </svg>
      <p className="sd-caption">
        chronos-go runs in every pod — only the leader (★) enqueues each trigger once; standby pods take over on failure.
      </p>
    </div>
  );
}
