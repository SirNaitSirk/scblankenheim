import { ButtonLink } from "@/components/ui/button";
import { PageBody } from "@/components/admin/page-header";
import { PrintButton } from "@/components/ui/print-button";
import { getCurrentCampId } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { GENDER_LABELS, de } from "@/lib/admin/messages";
import { fullName } from "@/lib/admin/room-planning";
import { membersByCircle, unassignedPeople } from "@/lib/admin/tent-circles";
import { getTentCirclePlan } from "@/lib/admin/tent-circles-data";

const t = de.tentCircles;

/** Plain, printable list of tent circles: leader on top, participants sorted by name. */
export default async function TentCirclePrintPage() {
  await guardTab("/admin/zeltkreise");
  const plan = await getTentCirclePlan(await getCurrentCampId());
  const members = membersByCircle(plan.people);
  const personById = new Map(plan.people.map((p) => [p.id, p]));
  const unassigned = unassignedPeople(plan.people);
  const unassignedAll = [...unassigned.female, ...unassigned.male, ...unassigned.missing];

  return (
    <PageBody className="max-w-[900px]">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <ButtonLink href="/admin/zeltkreise" variant="ghost" size="sm">
          {t.printView.back}
        </ButtonLink>
        <PrintButton label={t.printView.print} />
      </div>

      <div className="print-sheet flex flex-col gap-10 rounded-card bg-white p-8 text-black shadow-card print:rounded-none print:p-0 print:shadow-none">
        <section className="flex flex-col gap-5">
          <header className="border-b-2 border-black pb-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              {t.printView.title(plan.campName ?? "")}
            </h1>
          </header>
          <div className="grid grid-cols-2 gap-4">
            {plan.circles.map((circle) => {
              const leader = circle.leaderId ? personById.get(circle.leaderId) : undefined;
              const people = members.get(circle.id) ?? [];
              return (
                <article key={circle.id} className="print-room flex flex-col gap-2 rounded-sm border border-black/70 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-display text-base font-bold">{circle.name}</h2>
                    <span className="text-xs">
                      {t.kinds[circle.kind]} · {t.circle.members(people.length)}
                    </span>
                  </div>
                  <p className="border-b-2 border-black/70 pb-1 text-sm">
                    <span className="font-semibold">{t.printView.leader}: </span>
                    {leader?.leads === circle.id ? fullName(leader) : t.printView.noLeader}
                  </p>
                  {people.length === 0 ? (
                    <p className="text-xs text-black/60">{t.printView.noMembers}</p>
                  ) : (
                    <ol className="flex flex-col text-sm">
                      {people.map((person) => (
                        <li key={person.id} className="border-b border-black/15 py-1 last:border-b-0">
                          {fullName(person)}
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {unassignedAll.length > 0 && (
          <section className="print-house flex flex-col gap-3">
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
