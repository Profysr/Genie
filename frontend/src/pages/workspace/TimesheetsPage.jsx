import { useState } from "react";
import { Loader } from "@/components/ui/Loader";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useTimesheet, formatDuration } from "@/hooks/useTimeTracking";
import { cn } from "@/lib/utils";
import { format, addWeeks, subWeeks, startOfWeek } from "date-fns";

export default function TimesheetsPage() {
  const { workspaceSlug } = useParams();
  const [weekDate, setWeekDate] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const weekStr = format(weekDate, "yyyy-'W'ww");
  const { data, isLoading } = useTimesheet(workspaceSlug, weekStr);

  const days = data?.days || [];
  const rows = data?.rows || [];

  const totalPerDay = days.map((day) =>
    rows.reduce((sum, row) => sum + (row.days[day] || 0), 0),
  );
  const grandTotal = totalPerDay.reduce((a, b) => a + b, 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Timesheets</h1>
        </div>

        {/* Week navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekDate((d) => subWeeks(d, 1))}
            className="p-1.5 rounded-lg border hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[180px] text-center">
            {format(weekDate, "MMM d")} –{" "}
            {format(addWeeks(weekDate, 1), "MMM d, yyyy")}
          </span>
          <button
            onClick={() => setWeekDate((d) => addWeeks(d, 1))}
            className="p-1.5 rounded-lg border hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setWeekDate(startOfWeek(new Date(), { weekStartsOn: 1 }))
            }
            className="text-xs text-muted-foreground border rounded-lg px-2.5 py-1.5 hover:bg-accent transition-colors ml-2"
          >
            This week
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <Loader className="h-32" />
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">
                    Member
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="text-center px-3 py-3 font-medium text-muted-foreground"
                    >
                      <div>{format(new Date(day), "EEE")}</div>
                      <div className="text-xs font-normal">
                        {format(new Date(day), "MMM d")}
                      </div>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={days.length + 2}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      No time logged this week.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr
                      key={row.user.id}
                      className={cn(
                        "border-t",
                        i % 2 === 0 ? "bg-card" : "bg-muted/20",
                      )}
                    >
                      <td className="px-4 py-3 font-medium">{row.user.name}</td>
                      {days.map((day) => {
                        const secs = row.days[day] || 0;
                        return (
                          <td key={day} className="text-center px-3 py-3">
                            {secs > 0 ? (
                              <span className="text-foreground font-medium">
                                {formatDuration(secs)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center px-4 py-3 font-semibold text-primary">
                        {formatDuration(row.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t bg-muted/50 font-semibold">
                    <td className="px-4 py-3 text-muted-foreground">Total</td>
                    {totalPerDay.map((secs, i) => (
                      <td key={i} className="text-center px-3 py-3">
                        {secs > 0 ? (
                          formatDuration(secs)
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    ))}
                    <td className="text-center px-4 py-3 text-primary">
                      {formatDuration(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
