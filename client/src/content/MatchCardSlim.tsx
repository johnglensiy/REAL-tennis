import { useState } from 'react';
import PlayerRowSlim from './PlayerRowSlim';
import type { MatchEntry } from '../components/MatchCard';
import type { TeamSnapshot } from '../App';

const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];

function ScoreboardSlim({ playerTeam, opponentTeam, matchStatus }: {
    playerTeam: TeamSnapshot;
    opponentTeam: TeamSnapshot;
    matchStatus: string;
}) {
    const sets = playerTeam.setScores
        .map((a, i) => ({ a: a ?? 0, b: opponentTeam.setScores[i] ?? 0, tb: null }))
        .filter((_, i) => playerTeam.setScores[i] !== null || opponentTeam.setScores[i] !== null);

    const isGameComplete = playerTeam.gameScore === 'GAME' || opponentTeam.gameScore === 'GAME';

    if (sets.length > 0) {
        const last = sets[sets.length - 1];
        if (playerTeam.gameScore === 'GAME') {
            sets[sets.length - 1] = { ...last, a: last.a + 1 };
        } else if (opponentTeam.gameScore === 'GAME') {
            sets[sets.length - 1] = { ...last, b: last.b + 1 };
        }
    }

    return (
        <div>
            <PlayerRowSlim
                who="a"
                firstName={playerTeam.firstName}
                lastName={playerTeam.lastName}
                seed={playerTeam.seed}
                country={playerTeam.country}
                sets={sets}
                point={isGameComplete ? 0 : playerTeam.gameScore || 0}
                isServing={isGameComplete ? !playerTeam.isServer : playerTeam.isServer}
                won={matchStatus === 'F'}
                ballColor="yellow"
            />
            <PlayerRowSlim
                who="b"
                firstName={opponentTeam.firstName}
                lastName={opponentTeam.lastName}
                seed={opponentTeam.seed}
                country={opponentTeam.country}
                sets={sets}
                point={isGameComplete ? 0 : opponentTeam.gameScore || 0}
                isServing={isGameComplete ? !opponentTeam.isServer : opponentTeam.isServer}
                won={matchStatus === 'F'}
                ballColor="yellow"
            />
        </div>
    );
}

export default function MatchCardSlim({ entry }: { entry: MatchEntry }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full outline">
            <button className="w-full text-left" onClick={() => setIsOpen(prev => !prev)}>
                <ScoreboardSlim
                    playerTeam={entry.playerTeam}
                    opponentTeam={entry.opponentTeam}
                    matchStatus={entry.matchStatus}
                />
            </button>

            <div style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows 0.3s ease',
            }}>
                <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse' }}>
                    {entry.events.map((e) => {
                        if (e.type === 'point') return null; // skip point cards in slim view

                        const winnerTeam = e.winner === '1' ? entry.playerTeam : entry.opponentTeam;
                        const setIdx = (e.playerSetScores?.length ?? 1) - 1;
                        const ordinal = ordinals[setIdx] ?? `${setIdx + 1}th`;
                        const aGames = (e.playerSetScores?.at(-1) ?? 0) + (e.winner === '1' ? 1 : 0);
                        const bGames = (e.opponentSetScores?.at(-1) ?? 0) + (e.winner === '2' ? 1 : 0);

                        if (e.type === 'game') {
                            const leader = aGames > bGames ? entry.playerTeam : aGames < bGames ? entry.opponentTeam : null;
                            const hi = Math.max(aGames, bGames);
                            const lo = Math.min(aGames, bGames);
                            const description = leader
                                ? `${leader.lastName} leads ${ordinal} set ${hi}-${lo}`
                                : `${ordinal} set tied ${aGames}-${aGames}`;
                            return (
                                <div key={e.id} style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)', textAlign: 'center', padding: '8px 12px' }}>
                                    Game {winnerTeam.lastName}. {description}
                                </div>
                            );
                        }

                        if (e.type === 'set') {
                            const pScores = [...(e.playerSetScores ?? [])];
                            const oScores = [...(e.opponentSetScores ?? [])];
                            pScores[pScores.length - 1] = aGames;
                            oScores[oScores.length - 1] = bGames;
                            const playerSetsWon = pScores.filter((s, i) => s > oScores[i]).length;
                            const opponentSetsWon = oScores.filter((s, i) => s > pScores[i]).length;
                            const setsScore = e.winner === '1' ? `${playerSetsWon}-${opponentSetsWon}` : `${opponentSetsWon}-${playerSetsWon}`;
                            return (
                                <div key={e.id} style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)', textAlign: 'center', padding: '8px 12px' }}>
                                    Game and set {winnerTeam.lastName}. {winnerTeam.lastName} leads {setsScore}
                                </div>
                            );
                        }

                        return (
                            <div key={e.id} style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)', textAlign: 'center', padding: '8px 12px' }}>
                                Game, set and match {winnerTeam.lastName}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
