/** Auswahlkarte für die Rolle (Investor / Emittent), als Radio-Button. */
export default function RoleCard({
  id,
  name,
  selected,
  title,
  desc,
  onSelect,
}: {
  id: string;
  name: string;
  selected: boolean;
  title: string;
  desc: string;
  onSelect: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={[
        'flex cursor-pointer flex-col rounded-lg border-2 bg-white p-4 transition-colors duration-150',
        selected ? 'border-accent' : 'border-navy/10 hover:border-accent/50',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <input type="radio" id={id} name={name} checked={selected} onChange={onSelect} className="h-4 w-4 accent-accent" />
        <span className="text-sm font-semibold text-navy">{title}</span>
      </div>
      <p className="mt-1 pl-6 text-xs text-muted">{desc}</p>
    </label>
  );
}
