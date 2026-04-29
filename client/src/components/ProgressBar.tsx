interface Props {
  value: number;       // 0–100
  color?: string;      // tailwind bg class or hex
  height?: string;
  showLabel?: boolean;
  animate?: boolean;
}

export default function ProgressBar({ value, color, height = 'h-2', showLabel, animate }: Props) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const isOver  = value > 100;

  const barColor = isOver
    ? 'bg-red-500'
    : color ?? 'bg-indigo-500';

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} rounded-full ${barColor} ${animate ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${Math.min(clamped, 100)}%` }}
        />
      </div>
      {showLabel && (
        <p className={`text-xs mt-1 text-right font-medium ${isOver ? 'text-red-500' : 'text-slate-500'}`}>
          {Math.round(clamped)}%
        </p>
      )}
    </div>
  );
}
