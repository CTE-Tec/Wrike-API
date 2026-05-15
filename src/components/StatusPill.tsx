import { STATUS_LABELS, STATUS_COLORS, type TaskStatus } from '../lib/types';

export default function StatusPill({ status }: { status: TaskStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className="pill"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
