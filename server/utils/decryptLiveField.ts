import CryptoJS from 'crypto-js';

const KEY_MAP: Record<string, string> = {
    a11: 'cruciality', a12: 'trajectoryData', a13: 'serverId', a14: 'scorerId',
    a15: 'receiverId', a16: 'ballSpeed', a17: 'returnSpeed', a18: 'returnSpeedFrench',
    a19: 'spin', a20: 'heightAboveNet', a21: 'ballSpeedFrench', a22: 'heightAboveNetFrench',
    a23: 'distanceOutsideCourt', a24: 'distanceOutsideCourtFrench', a25: 'strokeType',
    a26: 'runAroundForeHand', a27: 'ballHitCordinate', a28: 'ballPeakCordinate',
    a29: 'ballNetCordinate', a30: 'ballBounceCordinate', a31: 'ballLastCordinate',
    a32: 'serverCordinate', a33: 'receiverCordinate', a34: 'serveBounceCordinate',
    a35: 'scoreBoard', a36: 'serveDirectionId', a37: 'aces', a38: 'convertedBreakPoints',
    a39: 'doubleFault', a40: 'firstServeIn', a41: 'firstServePointsWon', a42: 'netPoints',
    a43: 'pointsWon', a44: 'returnPoints', a45: 'secondServeIn', a46: 'secondServePointsWon',
    a47: 'unforcedError', a48: 'winner', a49: 'statsData', a50: 'pointsData',
    a51: 'percentage', a52: 'crucialPercentage', a53: 'percentagePlayer',
    a54: 'percentageOpponent', a55: 'percentagePlayerCrucial', a56: 'percentageOpponentCrucial',
    a57: 'count', a58: 'onCourt', a59: 'set0', a60: 'set1', a61: 'set2', a62: 'set3',
    a63: 'set4', a64: 'set5', a65: 'adCourt', a66: 'deuceCourt', a67: 'percentageT',
    a68: 'percentageM', a69: 'percentageW', a70: 'x', a71: 'y', a72: 'z',
    a73: 'position', a74: 'erroneousBall', a75: 'isMatchComplete', a76: 'eventType',
    a77: 'courtName', a78: 'courtId', a79: 'playersData', a80: 'setsCompleted',
    a81: 'pointId', a82: 'matchStatus', a83: 'playerTeam', a84: 'opponentTeam',
    a85: 'name', a86: 'id', a87: 'country', a88: 'seed', a89: 'returnPlacement',
    a90: 'errorType', a91: 'winnerPlacement', a92: 'unforcedErrorPlacement',
    a93: 'rallyLength', a94: 'maxRally', a95: 'pointEndType', a96: 'serveType',
    a97: 'court', a98: 'setNumber', a99: 'set', a100: 'game', a101: 'point',
    a102: 'serve', a103: 'hand', a104: 'breakPoint', a105: 'breakPointConverted',
    a106: 'trappedByNet', a107: 'pointNumber', a108: 'isTieBreak', a109: 'setWinner',
    a110: 'avgAcesInTournamentByPlayer', a111: 'convertedBreakPointsInTournamentByPlayer',
    a112: 'avgDoubleFaultInTournamentByPlayer', a113: 'firstServeInInTournamentByPlayer',
    a114: 'avgFirstServePointsWonInTournamentByPlayer', a115: 'avgNetPointsInTournamentByPlayer',
    a116: 'avgReturnPointsInTournamentByPlayer', a117: 'secondServeInInTournamentByPlayer',
    a118: 'secondServePointsWonInTournamentByPlayer', a119: 'avgUnforcedErrorInTournamentByPlayer',
    a120: 'avgWinnerInTournamentByPlayer', a121: 'firstServePointsWonInTournamentByPlayer',
    a122: 'playerSet1Score', a123: 'playerSet2Score', a124: 'playerSet3Score',
    a125: 'playerSet4Score', a126: 'playerSet5Score', a127: 'playerSet1TieBreakScore',
    a128: 'playerSet2TieBreakScore', a129: 'playerSet3TieBreakScore', a130: 'playerSet4TieBreakScore',
    a131: 'playerSet5TieBreakScore', a132: 'opponentSet1Score', a133: 'opponentSet2Score',
    a134: 'opponentSet3Score', a135: 'opponentSet4Score', a136: 'opponentSet5Score',
    a137: 'opponentSet1TieBreakScore', a138: 'opponentSet2TieBreakScore', a139: 'opponentSet3TieBreakScore',
    a140: 'opponentSet4TieBreakScore', a141: 'opponentSet5TieBreakScore',
    a142: 'playergamescore', a143: 'opponentgamescore', a144: 'crucial',
    a145: 'isSetWinning', a146: 'isMatchWinning', a147: 'receiver', a148: 'server',
    a149: 'time', a150: 'shotType', a151: 'playerPositionsData', a152: 'belowCourt',
};

function makeKey(lastModified: string): string {
    const e = new Date(lastModified);
    const n = new Date(e.getTime()).getUTCDate();
    const r = parseInt((n < 10 ? '0' + n : '' + n).split('').reverse().join(''));
    const a = e.getFullYear();
    const i = parseInt(a.toString().split('').reverse().join(''));
    let o = parseInt(e.getTime().toString(), 16).toString(36) + ((a + i) * (n + r)).toString(24);
    const s = o.length;
    if (s < 14) for (let l = 0; l < 14 - s; l++) o += '0';
    else if (s > 14) o = o.substr(0, 14);
    return '#' + o + '$';
}

function remapKeys(obj: any): any {
    if (Array.isArray(obj)) return obj.map(remapKeys);
    if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [KEY_MAP[k] ?? k, remapKeys(v)])
        );
    }
    return obj;
}

export function decryptField(field: { lastModified: string; response: string }): any {
    const k = makeKey(field.lastModified);
    const dec = CryptoJS.AES.decrypt(
        field.response,
        CryptoJS.enc.Utf8.parse(k),
        { iv: CryptoJS.enc.Utf8.parse(k.toUpperCase()), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    return remapKeys(JSON.parse(dec.toString(CryptoJS.enc.Utf8)));
}
