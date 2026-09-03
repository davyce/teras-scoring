type Props = {
  value: number;
  min?: number;
  max?: number;
  title?: string;
};

export default function GradientGauge({ value, min = 300, max = 850, title }: Props) {
  const clamped = Math.max(min, Math.min(max, value));
  const pct = ((clamped - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {title && <div className="sr-only">{title}</div>}
      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #22d3ee, #3b82f6 60%, #8b5cf6)",
          }}
        />
      </div>
    </div>
  );
}
