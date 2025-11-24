interface CalendarHeatmapProps {
  history: Array<{
    date: string;
    completed: boolean;
  }>;
}

export default function CalendarHeatmap({ history: _history }: CalendarHeatmapProps) {
  // Placeholder - implementation removed for now
  return (
    <div className="w-full py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
      Calendar heatmap coming soon
    </div>
  );
}

