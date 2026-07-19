import { ActivityRow } from "@/presentation/components/social/ActivityRow";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useUserDiary } from "@/presentation/hooks/useActivity";

export function DiarySection({ userId }: { userId: string | null }) {
  const { data, isLoading } = useUserDiary(userId);

  if (isLoading) {
    return (
      <section className="mt-8 px-5">
        <div className="flex h-20 items-center justify-center">
          <Spinner />
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 px-5">
      <h2 className="mb-1 text-[13px] font-semibold tracking-wide text-mist-400 uppercase">
        Recent Activity
      </h2>
      <ul className="divide-y divide-ink-800">
        {data.map((event) => (
          <ActivityRow
            key={`${event.eventType}-${event.seriesId}-${event.occurredAt}`}
            event={event}
            showActor={false}
          />
        ))}
      </ul>
    </section>
  );
}
