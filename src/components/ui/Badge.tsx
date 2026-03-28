import { STATUS_COLORS, STATUS_LABELS } from '../../lib/constants';
import type { InstanceStatus } from '../../types';

interface BadgeProps {
  status: InstanceStatus | string;
  className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
