type WaterGaugeProps = {
  percent: number;
};

export default function WaterGauge({ percent }: WaterGaugeProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(percent, 100)) / 100) * circumference;

  return (
    <div className="water-gauge">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="water-gauge-track" cx="60" cy="60" r={radius} />
        <circle
          className="water-gauge-value"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="water-gauge-label">
        <span>Poziom wody</span>
        <strong>{Math.round(percent)}%</strong>
      </div>
    </div>
  );
}
