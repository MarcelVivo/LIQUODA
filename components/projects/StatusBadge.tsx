import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import type { PublicStatus } from '@/lib/projects';

const variants = { open: 'active', funded: 'info', closed: 'neutral' } as const;

export default function StatusBadge({ status }: { status: PublicStatus }) {
  const t = useTranslations('projects.statuses');
  return <Badge label={t(status)} variant={variants[status]} />;
}
