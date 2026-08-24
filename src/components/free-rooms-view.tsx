"use client";
import { useState } from "react";
import { DoorOpen, FlaskConical, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PeriodAvailability } from "@/lib/free-rooms";
import { Day } from "@/lib/types";
import { dayName, timeToMinutes } from "@/lib/next-class-engine";
import { cn } from "@/lib/utils";

export function FreeRoomsView({
  days,
  availabilityByDay,
}: {
  days: Day[];
  availabilityByDay: Record<string, PeriodAvailability[]>;
}) {
  const today = dayName(new Date());
  const defaultDay = today && days.includes(today) ? today : days[0];
  const [selectedDay, setSelectedDay] = useState<string>(defaultDay ?? days[0]);

  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const isToday = selectedDay === today;

  if (days.length === 0) {
    return <p className="text-sm text-neutral-500">No timetable data available.</p>;
  }

  return (
    <Tabs value={selectedDay} onValueChange={setSelectedDay}>
      <TabsList className="flex-wrap">
        {days.map((d) => (
          <TabsTrigger key={d} value={d}>
            {d.slice(0, 3)}
            {d === today && <span className="ml-1 text-[10px] opacity-70">•today</span>}
          </TabsTrigger>
        ))}
      </TabsList>

      {days.map((d) => (
        <TabsContent key={d} value={d} className="mt-4 flex flex-col gap-3">
          {(availabilityByDay[d] ?? []).map((slot, i) => {
            const isCurrentPeriod =
              isToday &&
              nowMins >= timeToMinutes(slot.period.start_time) &&
              nowMins < timeToMinutes(slot.period.end_time);

            return (
              <Card key={i} className={cn(isCurrentPeriod && "border-neutral-900 dark:border-white")}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-neutral-400" />
                      <span className="font-medium">{slot.period.label}</span>
                      {isCurrentPeriod && <Badge>Now</Badge>}
                    </div>
                    <span className="text-xs text-neutral-500">
                      {slot.freeRooms.length + slot.freeLabs.length} free
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                        <DoorOpen className="h-3.5 w-3.5" />
                        Free classrooms ({slot.freeRooms.length})
                      </p>
                      {slot.freeRooms.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {slot.freeRooms.map((r) => (
                            <span
                              key={r}
                              className="rounded-lg bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400">All booked</p>
                      )}
                    </div>

                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                        <FlaskConical className="h-3.5 w-3.5" />
                        Free labs ({slot.freeLabs.length})
                      </p>
                      {slot.freeLabs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {slot.freeLabs.map((r) => (
                            <span
                              key={r}
                              className="rounded-lg bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400">All booked</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
}
