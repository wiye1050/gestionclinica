interface WeekDay {
  date: Date;
  label: string;
  dayNumber: string;
  isToday: boolean;
  isSelected: boolean;
}

interface WeekDaySelectorProps {
  weekDays: WeekDay[];
  onDateSelect: (date: Date) => void;
}

export default function WeekDaySelector({ weekDays, onDateSelect }: WeekDaySelectorProps) {
  return (
    <div>
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-text-muted">
        Semana
      </p>
      <div className="flex flex-wrap gap-1.5">
        {weekDays.map((day) => {
          const isActive = day.isSelected;
          return (
            <button
              key={`${day.label}-${day.dayNumber}`}
              onClick={() => onDateSelect(day.date)}
              className={`flex flex-col items-center rounded-lg border px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide transition-all focus-visible:focus-ring ${
                isActive
                  ? 'border-brand bg-brand/20 text-text'
                  : 'border-border bg-card text-text-muted hover:bg-cardHover'
              }`}
            >
              <span>{day.label}</span>
              <span className="text-sm leading-none text-text">{day.dayNumber}</span>
              {day.isToday && <span className="text-[8px] text-brand">hoy</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
