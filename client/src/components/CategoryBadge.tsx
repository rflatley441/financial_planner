interface Props {
  name?: string;
  icon?: string;
  color?: string;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ name, icon, color, size = 'md' }: Props) {
  if (!name) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-400">
        Uncategorized
      </span>
    );
  }

  const bg  = color ? `${color}20` : '#94A3B820';
  const txt = color ?? '#94A3B8';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
      style={{ backgroundColor: bg, color: txt }}
    >
      {icon && <span>{icon}</span>}
      {name}
    </span>
  );
}
