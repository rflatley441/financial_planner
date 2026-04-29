import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBg?: string;
  trend?: number;
  trendLabel?: string;
  valueColor?: string;
}

export default function StatCard({ title, value, subtitle, icon: Icon, iconBg, trend, trendLabel, valueColor }: Props) {
  const positive = (trend ?? 0) >= 0;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg ?? 'bg-indigo-50'}`}>
            <Icon size={18} className="text-indigo-600" />
          </div>
        )}
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${valueColor ?? 'text-slate-900'}`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{positive ? '+' : ''}{typeof trend === 'number' ? `$${Math.abs(trend).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : trend}</span>
          {trendLabel && <span className="text-slate-400 font-normal ml-0.5">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
