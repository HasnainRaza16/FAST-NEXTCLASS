import { getActiveDays, getRoomAvailability } from "@/lib/free-rooms";
import { FreeRoomsView } from "@/components/free-rooms-view";

export default function FreeRoomsPage() {
  const days = getActiveDays();
  const availabilityByDay = Object.fromEntries(days.map((d) => [d, getRoomAvailability(d)]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Free Rooms &amp; Labs</h1>
        <p className="text-sm text-neutral-500">
          See which rooms and labs are empty, period by period, across the whole department — not just your own classes.
        </p>
      </div>
      <FreeRoomsView days={days} availabilityByDay={availabilityByDay} />
    </div>
  );
}
