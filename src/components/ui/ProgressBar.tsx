interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max, color = 'bg-indigo-500', showLabel = true }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full">
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>${value.toFixed(2)} earned</span>
          <span>${max.toFixed(2)} cap</span>
        </div>
      )}
    </div>
  );
}
