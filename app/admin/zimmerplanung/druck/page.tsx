import { ButtonLink } from "@/components/ui/button";
import { PageBody } from "@/components/admin/page-header";
import { PrintButton } from "@/components/ui/print-button";
import { getCurrentCampId } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { GENDER_LABELS, de } from "@/lib/admin/messages";
import {
  compareByName,
  fullName,
  groupUnassigned,
  occupantsByRoom,
} from "@/lib/admin/room-planning";
import { getRoomPlan } from "@/lib/admin/rooms-data";
import { cn } from "@/lib/cn";

const t = de.rooms;

/** Plain, printable room plan: one house per A4 page, rooms as boxes with names. */
export default async function RoomPlanPrintPage() {
  await guardTab("/admin/zimmerplanung");
  const plan = await getRoomPlan(await getCurrentCampId());
  const occupants = occupantsByRoom(plan.people);
  const unassigned = groupUnassigned(plan.people);
  const unassignedAll = [...unassigned.female, ...unassigned.male, ...unassigned.missing];
  const title = t.printView.title(plan.campName ?? "");

  return (
    <PageBody className="max-w-[900px]">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <ButtonLink href="/admin/zimmerplanung" variant="ghost" size="sm">
          {t.printView.back}
        </ButtonLink>
        <PrintButton label={t.printView.print} />
      </div>

      <div className="print-sheet flex flex-col gap-10 rounded-card bg-white p-8 text-black shadow-card print:rounded-none print:p-0 print:shadow-none">
        {plan.houses.map((house) => (
          <section key={house.id} className="print-house flex flex-col gap-5">
            <header className="flex items-baseline justify-between gap-4 border-b-2 border-black pb-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{house.name}</h1>
              <span className="text-sm">{title}</span>
            </header>
            <div className="grid grid-cols-2 gap-4">
              {house.rooms.map((room) => {
                const people = [...(occupants.get(room.id) ?? [])].sort(compareByName);
                const free = Math.max(0, room.beds - people.length);
                return (
                  <article key={room.id} className="print-room flex flex-col gap-2 rounded-sm border border-black/70 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-display text-base font-bold">{room.name}</h2>
                      <span className="text-xs">
                        {room.gender ? GENDER_LABELS[room.gender] : t.room.unset} ·{" "}
                        {t.room.occupancy(String(people.length), String(room.beds))}
                      </span>
                    </div>
                    <ol className="flex flex-col text-sm">
                      {people.map((person) => (
                        <li key={person.id} className="border-b border-black/15 py-1 last:border-b-0">
                          {fullName(person)}
                        </li>
                      ))}
                    </ol>
                    {free > 0 && <p className="text-xs text-black/60">{t.printView.freeBeds(free)}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {unassignedAll.length > 0 && (
          <section className={cn("print-house flex flex-col gap-3")}>
            <header className="border-b-2 border-black pb-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{t.printView.unassigned}</h1>
            </header>
            <ul className="columns-2 text-sm">
              {unassignedAll.map((person) => (
                <li key={person.id} className="py-0.5">
                  {fullName(person)}
                  {person.gender ? ` · ${GENDER_LABELS[person.gender]}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageBody>
  );
}
