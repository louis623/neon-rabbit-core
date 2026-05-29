import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import { HeroAndAgenda } from "@/components/home/HeroAndAgenda";
import { AffiliateStrip } from "@/components/shop/AffiliateStrip";
import { getLiveShows, getReps } from "@/lib/sparkle-finder/service";

export default function Home() {
  const liveShows = getLiveShows();
  const reps = getReps();

  return (
    <>
      <SparkleFinderNav />
      <main>
        <HeroAndAgenda liveShows={liveShows} reps={reps} />
        <AffiliateStrip />
      </main>
    </>
  );
}
