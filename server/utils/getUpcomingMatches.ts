import { BrowserContext } from 'playwright';

export interface UpcomingMatch {
    court: string;
    time: string;
    round: string;
    player1: { name: string; seed: string | null; entry: string | null; atpId: string | null };
    player2: { name: string; seed: string | null; entry: string | null; atpId: string | null };
    matchUrl: string | null;
}

export interface DaySchedule {
    label: string;
    value: string;
    date: string;   // ISO calendar date, e.g. "2026-06-30"
    matches: UpcomingMatch[];
}

const MONTHS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
];

/**
 * Converts a scraped header date like "Tue, 30 June, 2026" to an ISO
 * calendar date "2026-06-30". Built from string parts (no `new Date`),
 * so it's timezone-independent. Returns '' if the input can't be parsed.
 */
const toISODate = (raw: string): string => {
    const m = raw.match(/(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})/);
    if (!m) return '';
    const monthIdx = MONTHS.indexOf(m[2].toLowerCase());
    if (monthIdx === -1) return '';
    const day = m[1].padStart(2, '0');
    const month = String(monthIdx + 1).padStart(2, '0');
    return `${m[3]}-${month}-${day}`;
};

// ATP player ids are short alphanumeric tokens, e.g. "d923", "r0go", "s0ag",
// "cd85" — letters and digits mixed, so no fixed letter/digit split.
const ATP_ID_RE = /^[a-z0-9]{3,6}$/i;

/**
 * Extracts the ATP player id from a profile link href, e.g.
 * "/en/players/damir-dzumhur/d923/overview" -> "d923". The href is the
 * reliable source: it's always in the DOM, unlike the headshot image whose
 * `src` may not be populated yet (lazy-loaded / off-screen rows).
 */
const atpIdFromHref = (href: string): string | null => {
    const m = href.match(/\/players\/[^/]+\/([a-z0-9]+)(?:\/|$)/i);
    return m && ATP_ID_RE.test(m[1]) ? m[1].toLowerCase() : null;
};

/**
 * Fallback: extracts the id from a headshot image `src`, e.g.
 * "/-/media/alias/player-headshot/d923" -> "d923". Query strings, hashes and
 * any extension are stripped. Returns null for empty/placeholder sources.
 */
const atpIdFromImg = (src: string): string | null => {
    if (!src) return null;
    const path = src.split(/[?#]/)[0].replace(/\/+$/, '');
    const last = path.substring(path.lastIndexOf('/') + 1).replace(/\.[a-z0-9]+$/i, '');
    return ATP_ID_RE.test(last) ? last.toLowerCase() : null;
};

/** Resolve a player's ATP id, preferring the profile href over the image src. */
const extractAtpId = (href: string, imgSrc: string): string | null =>
    atpIdFromHref(href) ?? atpIdFromImg(imgSrc);

/**
 * Scrapes the ATP daily-schedule page for upcoming singles matches, grouped by day.
 * May migrate away from this due to inconsistent time displays
 *
 * Opens the schedule URL, reads the day options from the `#matchDate-filter`
 * dropdown, then for each day: programmatically selects it (dispatching a
 * `change` event so the page re-renders), reads that day's exact date from the
 * `h4.day` header, and scrapes every `.schedule` row. Player strings are parsed
 * into name/seed/entry, and WTA matches and doubles are filtered out.
 *
 * @param context - A Playwright browser context; a fresh page is opened and closed internally.
 * @param scheduleUrl - The ATP daily-schedule URL to scrape (e.g. a tournament's `daily-schedule` page).
 * @returns A `DaySchedule[]`, one entry per day, each with its label/value/date and the day's `UpcomingMatch[]`.
 *          Resolves to `[]` if scraping fails (errors are caught and logged, not thrown).
 */
export const getUpcomingMatches = async (
    context: BrowserContext,
    scheduleUrl: string
): Promise<DaySchedule[]> => {
    const page = await context.newPage();

    try {
        await page.goto(scheduleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('select#matchDate-filter', { timeout: 10000 });

        const days = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('select#matchDate-filter option')).map(o => ({
                label: o.textContent?.trim() ?? '',
                value: (o as HTMLOptionElement).value,
            }));
        });

        console.log('[Schedule] Days:', days);

        const rawTournSchedule: DaySchedule[] = [];

        for (const day of days) {
            await page.evaluate((value) => {
                const select = document.querySelector('select#matchDate-filter') as HTMLSelectElement;
                select.value = value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }, day.value);
            await page.waitForTimeout(800 + Math.random() * 400);

            // exact date from the day header, e.g. "Tue, 30 June, 2026"
            // (h4.day holds the date as a text node, with "(Day N)" in a child span)
            const dateText = await page.evaluate(() => {
                const header = document.querySelector('.tournament-day h4.day');
                if (!header) return '';
                const spanText = header.querySelector('span')?.textContent ?? '';
                return (header.textContent ?? '').replace(spanText, '').replace(/\s+/g, ' ').trim();
            });

            // send ISO over the wire; the client formats it for display
            const isoDate = toISODate(dateText);

            const dayRawMatches = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.schedule')).map(el => {
                    const locationText = el.querySelector('.schedule-location-timestamp')?.textContent ?? '';
                    const timeText = el.querySelector('.matchtime')?.textContent?.trim() ?? '';
                    const roundText = el.querySelector('.schedule-type')?.textContent?.trim() ?? '';
                    const players = el.querySelector('.schedule-players');
                    const player1Raw = players?.querySelector('.player')?.textContent ?? '';
                    const player2Raw = players?.querySelector('.opponent')?.textContent ?? '';
                    const player1ImgSrc = players?.querySelector('.player img.player-image')?.getAttribute('src') ?? '';
                    const player2ImgSrc = players?.querySelector('.opponent img.player-image')?.getAttribute('src') ?? '';
                    // profile link carries the ATP id reliably (e.g. /en/players/damir-dzumhur/d923/overview)
                    const player1Href = players?.querySelector('.player .name a')?.getAttribute('href') ?? '';
                    const player2Href = players?.querySelector('.opponent .name a')?.getAttribute('href') ?? '';
                    const matchUrl = el.querySelector('a[href*="scores"]')?.getAttribute('href') ?? null;
                    const matchType = el.querySelector('.schedule-cta .match-type')?.textContent?.trim() ?? '';
                    return { locationText, timeText, roundText, player1Raw, player2Raw, player1ImgSrc, player2ImgSrc, player1Href, player2Href, matchUrl, matchType };
                });
            });

            const parsePlayer = (raw: string, imgSrc: string, href: string) => {
                const cleaned = raw.replace(/\s+/g, ' ').trim();
                const seedMatch = cleaned.match(/\((\d+)\)/);
                const entryMatch = cleaned.match(/\(([A-Z]{1,3})\)/);
                const name = cleaned.replace(/\(\d+\)/g, '').replace(/\([A-Z]{1,3}\)/g, '').replace(/\s+/g, ' ').trim();
                return { name, seed: seedMatch?.[1] ?? null, entry: entryMatch?.[1] ?? null, atpId: extractAtpId(href, imgSrc) };
            };

            let currentCourt = '';
            const dayUpcomingMatches: UpcomingMatch[] = [];

            for (const raw of dayRawMatches) {
                const locationLines = raw.locationText.split('\n').map(l => l.trim()).filter(Boolean);
                if (locationLines.length > 0 && !locationLines[0].match(/^(Starts At|Followed By|Not Before)/i)) {
                    currentCourt = locationLines[0];
                }

                // skip WTA matches for now
                if (raw.matchType === 'WTA') continue;

                const p1 = parsePlayer(raw.player1Raw, raw.player1ImgSrc, raw.player1Href);
                const p2 = parsePlayer(raw.player2Raw, raw.player2ImgSrc, raw.player2Href);
                if (!p1.name && !p2.name) continue;

                // doubles: player names contain a space-separated pair (two initials + surnames)
                const isDoubles = /\w+\.\s+\w+\s+\w+\.\s+\w+/.test(p1.name);
                if (isDoubles) continue;

                dayUpcomingMatches.push({
                    court: currentCourt,
                    time: raw.timeText,
                    round: raw.roundText,
                    player1: p1,
                    player2: p2,
                    matchUrl: raw.matchUrl,
                });
            }

            console.log(`[Schedule] Day: ${day.label} (${dateText} -> ${isoDate}) — ${dayUpcomingMatches.length} matches`);
            rawTournSchedule.push({ label: day.label, value: day.value, date: isoDate, matches: dayUpcomingMatches });
        }

        return rawTournSchedule;
    } catch (e) {
        console.log('[Schedule] Error:', e);
        return [];
    } finally {
        await page.close();
    }
};
