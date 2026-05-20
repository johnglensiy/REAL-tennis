export interface WinnerPoint {
  pointId: string;
  pointEndType: 'Winner' | 'Ace' | string;
  // Players
  serverName: string;
  serverCountry: string;
  receiverName: string;
  receiverCountry: string;
  // Serve
  serveSpeed: string;
  serveType: string;
  serveNumber: number;
  // Shot
  hand: string;
  placement: string;
  court: string;
  // Rally
  rallyLength: number;
  shotSequence: string[];
  // Match position
  set: number;
  game: number;
  point: number;
  // Score at time of point
  playerGameScore: string;
  opponentGameScore: string;
  // Stats
  netClearance: string;
  ballHeightAtNet: string;
  // Flags
  breakPoint: boolean;
  isSetWinning: boolean;
  isMatchWinning: boolean;
}

export interface ParsedWinnersData {
  matchType: string;
  playerName: string;
  playerCountry: string;
  opponentName: string;
  opponentCountry: string;
  opponentSeed: string;
  winners: WinnerPoint[];
}

export function parseWinners(raw: any): ParsedWinnersData {
  const playerTeam = raw.a79?.a83?.[0];
  const opponentTeam = raw.a79?.a84?.[0];

  const playerMap: Record<string, { name: string; country: string }> = {};
  for (const p of raw.a79?.a83 ?? []) {
    playerMap[p.a86] = { name: p.a85, country: p.a87 };
  }
  for (const p of raw.a79?.a84 ?? []) {
    playerMap[p.a86] = { name: p.a85, country: p.a87 };
  }

  const winners: WinnerPoint[] = [];

  for (const [pointId, point] of Object.entries<any>(raw.a50 ?? {})) {
    const server = playerMap[point.a13] ?? { name: point.a13, country: '' };
    const receiver = playerMap[point.a15] ?? { name: point.a15, country: '' };
    const score = point.a35 ?? {};

    winners.push({
      pointId,
      pointEndType: point.a95,
      serverName: server.name,
      serverCountry: server.country,
      receiverName: receiver.name,
      receiverCountry: receiver.country,
      serveSpeed: point.a16 ?? 'N/A',
      serveType: point.a96 ?? 'N/A',
      serveNumber: point.a102 ?? 1,
      hand: point.a103 ?? 'N/A',
      placement: point.a91 ?? 'N/A',
      court: point.a97 ?? 'N/A',
      rallyLength: point.a93 ?? 0,
      shotSequence: Array.isArray(point.shotHandTypeIds) ? point.shotHandTypeIds : [],
      set: point.a98 ?? 0,
      game: point.a100 ?? 0,
      point: point.a101 ?? 0,
      playerGameScore: score.a142 ?? '',
      opponentGameScore: score.a143 ?? '',
      netClearance: point.a20 ?? 'N/A',
      ballHeightAtNet: point.a22 ?? 'N/A',
      breakPoint: point.a104 === true || point.a104 === 'true',
      isSetWinning: point.a145 === true || point.a145 === 'true',
      isMatchWinning: point.a146 === true || point.a146 === 'true',
    });
  }

  return {
    matchType: raw.a76 ?? '',
    playerName: playerTeam?.a85 ?? '',
    playerCountry: playerTeam?.a87 ?? '',
    opponentName: opponentTeam?.a85 ?? '',
    opponentCountry: opponentTeam?.a87 ?? '',
    opponentSeed: opponentTeam?.a88 ?? '',
    winners,
  };
}
