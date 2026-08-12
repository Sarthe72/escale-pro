export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex border-b border-slate-200 bg-white px-3 overflow-x-auto">
      {tabs.map(({ key, label, count }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`flex-shrink-0 flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
            active === key ? 'border-[#2d6a4f] text-[#2d6a4f]' : 'border-transparent text-slate-400'
          }`}>
          {label}
          {count !== undefined && (
            <span className={`text-xs rounded-full px-2 py-0.5 min-w-[22px] text-center ${
              active === key ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]' : 'bg-slate-100 text-slate-500'
            }`}>
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
