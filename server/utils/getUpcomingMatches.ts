import { BrowserContext } from 'playwright';
import { MatchDay, UpcomingMatch } from '../types.ts';

export const getUpcomingMatches = async (
    context: BrowserContext,
    scheduleUrl: string
): Promise<MatchDay[]> => {
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

        const matchDays: MatchDay[] = [];

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

            const rawMatches = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.schedule')).map(el => {
                    const locationText = el.querySelector('.schedule-location-timestamp')?.textContent ?? '';
                    const timeText = el.querySelector('.matchtime')?.textContent?.trim() ?? '';
                    const roundText = el.querySelector('.schedule-type')?.textContent?.trim() ?? '';
                    const players = el.querySelector('.schedule-players');
                    const player1Raw = players?.querySelector('.player')?.textContent ?? '';
                    const player2Raw = players?.querySelector('.opponent')?.textContent ?? '';
                    const matchUrl = el.querySelector('a[href*="scores"]')?.getAttribute('href') ?? null;
                    const matchType = el.querySelector('.schedule-cta .match-type')?.textContent?.trim() ?? '';
                    return { locationText, timeText, roundText, player1Raw, player2Raw, matchUrl, matchType };
                });
            });

            const parsePlayer = (raw: string) => {
                const cleaned = raw.replace(/\s+/g, ' ').trim();
                const seedMatch = cleaned.match(/\((\d+)\)/);
                const entryMatch = cleaned.match(/\(([A-Z]{1,3})\)/);
                const name = cleaned.replace(/\(\d+\)/g, '').replace(/\([A-Z]{1,3}\)/g, '').replace(/\s+/g, ' ').trim();
                return { name, seed: seedMatch?.[1] ?? null, entry: entryMatch?.[1] ?? null };
            };

            let currentCourt = '';
            const dayResult: UpcomingMatch[] = [];

            for (const raw of rawMatches) {
                const locationLines = raw.locationText.split('\n').map(l => l.trim()).filter(Boolean);
                if (locationLines.length > 0 && !locationLines[0].match(/^(Starts At|Followed By|Not Before)/i)) {
                    currentCourt = locationLines[0];
                }

                if (raw.matchType === 'WTA') continue;

                const p1 = parsePlayer(raw.player1Raw);
                const p2 = parsePlayer(raw.player2Raw);
                if (!p1.name && !p2.name) continue;

                // doubles: player names contain a space-separated pair (two initials + surnames)
                const isDoubles = /\w+\.\s+\w+\s+\w+\.\s+\w+/.test(p1.name);
                if (isDoubles) continue;

                dayResult.push({
                    court: currentCourt,
                    time: raw.timeText,
                    round: raw.roundText,
                    player1: p1,
                    player2: p2,
                    matchUrl: raw.matchUrl,
                });
            }

            console.log(`[Schedule] Day: ${day.label} (${dateText}) — ${dayResult.length} matches`);
            matchDays.push({ label: day.label, value: day.value, date: dateText, matches: dayResult });
        }

        return matchDays;
    } catch (e) {
        console.log('[Schedule] Error:', e);
        return [];
    } finally {
        await page.close();
    }
};
