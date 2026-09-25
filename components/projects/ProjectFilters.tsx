import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ASSET_TYPES, PUBLIC_STATUSES, type AssetType, type PublicStatus } from '@/lib/projects';

type Query = { asset?: string; status?: string };

function chipClass(active: boolean) {
  return [
    'liq-chip transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    active
      ? 'border-accent bg-accent text-white'
      : 'border-navy/15 bg-white/60 text-muted hover:border-accent hover:text-navy',
  ].join(' ');
}

function buildQuery(base: Query, patch: Query): Query {
  const q = { ...base, ...patch };
  return Object.fromEntries(Object.entries(q).filter(([, v]) => v)) as Query;
}

/** Filter als Links mit URL-Parametern; funktioniert ohne JavaScript. */
export default function ProjectFilters({
  assetType,
  status,
}: {
  assetType?: AssetType;
  status?: PublicStatus;
}) {
  const t = useTranslations('projects');
  const current: Query = { asset: assetType, status };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('filterAsset')}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={{ pathname: '/projekte', query: buildQuery(current, { asset: undefined }) }}
            className={chipClass(!assetType)}
            aria-current={!assetType ? 'true' : undefined}
          >
            {t('all')}
          </Link>
          {ASSET_TYPES.map((a) => (
            <Link
              key={a}
              href={{ pathname: '/projekte', query: buildQuery(current, { asset: a }) }}
              className={chipClass(assetType === a)}
              aria-current={assetType === a ? 'true' : undefined}
            >
              {t(`assetTypes.${a}`)}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('filterStatus')}</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={{ pathname: '/projekte', query: buildQuery(current, { status: undefined }) }}
            className={chipClass(!status)}
            aria-current={!status ? 'true' : undefined}
          >
            {t('all')}
          </Link>
          {PUBLIC_STATUSES.map((s) => (
            <Link
              key={s}
              href={{ pathname: '/projekte', query: buildQuery(current, { status: s }) }}
              className={chipClass(status === s)}
              aria-current={status === s ? 'true' : undefined}
            >
              {t(`statuses.${s}`)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
