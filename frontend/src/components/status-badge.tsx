import { Badge } from '@/components/ui/badge';

const RESOURCE_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; dot: string }> = {
  AVAILABLE: { label: 'Available', variant: 'success', dot: '🟢' },
  PARTIAL: { label: 'Partial', variant: 'info', dot: '🟡' },
  FULLY_ALLOCATED: { label: 'Fully Allocated', variant: 'warning', dot: '🟡' },
  OVER_ALLOCATED: { label: 'Overallocated', variant: 'danger', dot: '🔴' },
  LEAVE: { label: 'On Leave', variant: 'default', dot: '⚪' },
};

const PROJECT_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  PLANNING: { label: 'Planning', variant: 'info' },
  RUNNING: { label: 'Running', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
};

const PRIORITY_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  LOW: { label: 'Low', variant: 'default' },
  MEDIUM: { label: 'Medium', variant: 'info' },
  HIGH: { label: 'High', variant: 'warning' },
  CRITICAL: { label: 'Critical', variant: 'danger' },
};

export function ResourceStatusBadge({ status, withDot = true }: { status: string; withDot?: boolean }) {
  const info = RESOURCE_STATUS_MAP[status] ?? { label: status, variant: 'default' as const, dot: '' };
  return (
    <Badge variant={info.variant}>
      {withDot && info.dot ? `${info.dot} ` : ''}
      {info.label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const info = PROJECT_STATUS_MAP[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const info = PRIORITY_MAP[priority] ?? { label: priority, variant: 'default' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
