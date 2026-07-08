import { BrowserContext, Page } from 'playwright';
import { ScoreUpdated, SideScore } from '../../common/types.ts';

// shape of the ATP LiveMatches feed (only the fields we consume)
interface AtpSetScore {
    SetNumber: number;
    SetScore: number | null;
    TieBreakScore: number | null;
}

interface AtpTeam {
    GameScore: string;
    SetScores: AtpSetScore[];
    Seed: number;
    Player: {
        PlayerFirstName: string;
        PlayerLastName: string;
        PlayerCountry: string;
    };
}

interface AtpLiveMatch {
    MatchId: string;
    IsDoubles: boolean;
    MatchStatus: string;
    ServerTeam: number; // 0 => player team serving, else opponent
    PlayerTeam: AtpTeam;
    OpponentTeam: AtpTeam;
}

interface AtpLiveMatchesResponse {
    LiveMatches: AtpLiveMatch[] | null;
}

// SetNumber 0 is a placeholder row in the feed; drop it
const toSideScore = (team: AtpTeam): SideScore => ({
    name: `${team.Player.PlayerFirstName?.[0] ?? ''}. ${team.Player.PlayerLastName ?? ''}`.trim(),
    country: team.Player.PlayerCountry ?? '',
    seed: team.Seed ? String(team.Seed) : undefined,
    gameScore: team.GameScore ?? '',
    setScores: team.SetScores.filter(s => s.SetNumber > 0).map(s => s.SetScore),
});

// map one live-match snapshot -> ScoreUpdated DTO
const toScoreUpdated = (m: AtpLiveMatch): ScoreUpdated => ({
    type: 'score',
    matchId: m.MatchId,
    updateId: `${m.MatchId}-${Date.now()}`,
    playerScore: toSideScore(m.PlayerTeam),
    opponentScore: toSideScore(m.OpponentTeam),
    // the LiveMatches feed is a full-match snapshot, not a point event,
    // so per-point fields aren't available — sensible defaults for now
    scorer: 'p',
    server: m.ServerTeam === 0 ? 'p' : 'o',
    result: '',
    rallyLength: 0,
    isGameComplete: false,
    isSetComplete: false,
    timeElapsedInSeconds: 0,
    matchStatus: m.MatchStatus,
});

/**
 * Opens the ATP live-scores page and streams score updates.
 *
 * Same technique as {@link getUpcomingMatches}, but instead of scraping the DOM
 * once, it attaches a persistent `page.on('response')` listener. The live-scores
 * page polls a `/-/www/LiveMatches/{year}/{eventId}` JSON endpoint on an interval;
 * each response is mapped to `ScoreUpdated[]` and handed to `onUpdates`.
 *
 * The page is left open so the listener keeps firing; the returned `Page` is the
 * caller's handle to close it when done.
 *
 * @param context - A Playwright browser context; a fresh page is opened.
 * @param liveScoresUrl - The tournament's `live-scores` URL.
 * @param onUpdates - Called with a non-empty `ScoreUpdated[]` on each poll.
 * @returns The open `Page` (caller owns closing it).
 */
export const getLiveMatches = async (
    context: BrowserContext,
    liveScoresUrl: string,
    onUpdates: (updates: ScoreUpdated[]) => void
): Promise<Page> => {
    const page = await context.newPage();

    page.on('response', async response => {
        // e.g. https://www.atptour.com/en/-/www/LiveMatches/2026/540
        if (!/\/-\/www\/LiveMatches\//.test(response.url())) return;
        try {
            const json = (await response.json()) as AtpLiveMatchesResponse;
            const updates = (json.LiveMatches ?? [])
                .filter(m => !m.IsDoubles)
                .map(toScoreUpdated);
            console.log(`[LiveMatches] ${updates.length} update(s)`);
            if (updates.length > 0) onUpdates(updates);
        } catch (e) {
            console.log('[LiveMatches] parse error', e);
        }
    });

    await page.goto(liveScoresUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return page;
};
