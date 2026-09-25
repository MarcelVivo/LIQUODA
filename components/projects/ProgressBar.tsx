export default function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-cream-dark">
      <div
        className="h-2 rounded-full bg-accent transition-[width] duration-700"
        style={{ width: `${percent}%` }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      />
    </div>
  );
}
