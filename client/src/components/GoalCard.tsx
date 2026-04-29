import type { Goal } from '../types';
import { formatCurrency, GOAL_TYPE_LABELS } from '../utils/format';
import { formatDate } from '../utils/format';
import ProgressBar from './ProgressBar';
import { Calendar } from 'lucide-react';

interface Props {
  goal: Goal;
  onEdit?: (g: Goal) => void;
}

export default function GoalCard({ goal, onEdit }: Props) {
  const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <div
      className="card hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit?.(goal)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: goal.color }}
          />
          <div>
            <p className="text-sm font-semibold text-slate-800">{goal.name}</p>
            <p className="text-xs text-slate-400">{GOAL_TYPE_LABELS[goal.type] ?? goal.type}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-800">{formatCurrency(goal.current_amount)}</p>
          <p className="text-xs text-slate-400">of {formatCurrency(goal.target_amount)}</p>
        </div>
      </div>

      <ProgressBar
        value={pct}
        color={undefined}
        height="h-2.5"
        animate
      />

      <div className="flex items-center justify-between mt-2.5">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{Math.round(pct)}%</span> complete
          {remaining > 0 && <span className="ml-1">· {formatCurrency(remaining)} to go</span>}
        </p>
        {goal.target_date && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar size={11} />
            {formatDate(goal.target_date)}
          </div>
        )}
      </div>
      {goal.notes && (
        <p className="text-xs text-slate-400 mt-2 line-clamp-1">{goal.notes}</p>
      )}
    </div>
  );
}
