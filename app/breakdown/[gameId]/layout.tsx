import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rawintelsports.com";

const LABEL_TO_GRADE: Record<string, string> = {
  "CLEAR SPOT": "CLEAR_SPOT",
  "LEAN":       "LEAN",
  "FRAGILE":    "FRAGILE",
  "PASS":       "PASS",
};

function fmtDate(d: string): string {
  if (d.length !== 8) return d;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = parseInt(d.slice(4, 6), 10) - 1;
  const day = parseInt(d.slice(6, 8), 10);
  return `${months[m]} ${day}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId: rawId } = await params;
  const gameId = decodeURIComponent(rawId ?? "");

  const ogBase = `${SITE_URL}/api/og`;
  const fallbackOgUrl = `${ogBase}?gameId=${encodeURIComponent(gameId)}`;

  let homeTeam    = "";
  let awayTeam    = "";
  let signalGrade = "LEAN";
  let baseScript  = "";
  let gameDate    = "";
  let gameTime    = "";
  let sport       = "";
  let title       = "Game Breakdown — RawIntel";
  let description = "Six-step breakdown. Plain-English reasoning. Your call.";

  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("breakdowns")
      .select("breakdown_content, game_snapshot, sport, home_team, away_team, game_date")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const snap = data.game_snapshot as {
        homeTeam?: { teamAbv?: string; teamName?: string };
        awayTeam?: { teamAbv?: string; teamName?: string };
        gameTime?: string;
      } | null;

      homeTeam = snap?.homeTeam?.teamName ?? (data.home_team as string | null) ?? "";
      awayTeam = snap?.awayTeam?.teamName ?? (data.away_team as string | null) ?? "";
      gameDate = fmtDate((data.game_date as string | null) ?? "");
      gameTime = snap?.gameTime ?? "";
      sport    = (data.sport as string | null) ?? "";

      const content = data.breakdown_content as {
        confidenceLabel?: string;
        baseScript?: string;
        cardSummary?: string;
      } | null;

      if (content) {
        signalGrade = LABEL_TO_GRADE[content.confidenceLabel ?? ""] ?? "LEAN";
        const raw = content.baseScript ?? content.cardSummary ?? "";
        baseScript = raw.match(/^[^.!?]+[.!?]/)?.[0] ?? raw.slice(0, 130);
      }
    }
  } catch {
    // No breakdown yet — fall back to gameId-only OG URL
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: fallbackOgUrl, width: 1200, height: 630, alt: title }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [fallbackOgUrl],
      },
    };
  }

  if (homeTeam && awayTeam) {
    title       = `${awayTeam} at ${homeTeam} — RawIntel Breakdown`;
    description = baseScript || `${sport || "Game"} breakdown for ${awayTeam} at ${homeTeam}${gameDate ? ` · ${gameDate}` : ""}.`;
  }

  const ogParams = new URLSearchParams();
  ogParams.set("homeTeam",    homeTeam);
  ogParams.set("awayTeam",    awayTeam);
  ogParams.set("signalGrade", signalGrade);
  ogParams.set("baseScript",  baseScript);
  ogParams.set("gameDate",    gameDate);
  ogParams.set("gameTime",    gameTime);

  const ogUrl = homeTeam ? `${ogBase}?${ogParams.toString()}` : fallbackOgUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default function BreakdownLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
