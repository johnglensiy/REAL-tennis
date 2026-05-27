import { buildPointForMockStream } from "./buildPointForMockStream";

export function streamPointAndScheduleNext(
    res: any,
    pbpData: any,
    setIdx: number,
    gameIdx: number,
    pointIdx: number
) {
    const setData = pbpData.setData;
    if (setIdx >= setData.length) return;

    const gameData = setData[setIdx].gameData;
    if (gameIdx >= gameData.length) return;

    const pointData = gameData[gameIdx].pointData;
    if (pointIdx >= pointData.length) return;

    const currentPoint = pointData[pointIdx];

    // build and SSE a MatchSnapshot[] so the client receives the same shape as the real stream
    const snapshot = buildPointForMockStream(pbpData, setIdx, gameIdx, currentPoint);
    res.write(`data: ${JSON.stringify(snapshot)}\n\n`);

    // determine next indices
    let nextSet = setIdx;
    let nextGame = gameIdx;
    let nextPoint = pointIdx + 1;

    if (nextPoint >= pointData.length) {
        nextGame++;
        nextPoint = 0;
        if (nextGame >= gameData.length) {
            nextSet++;
            nextGame = 0;
        }
    }

    // check next point exists
    if (nextSet >= setData.length) return;
    const nextPointData = setData[nextSet].gameData[nextGame]?.pointData;
    if (!nextPointData || nextPoint >= nextPointData.length) return;

    const next = nextPointData[nextPoint];
    const delay = (next.currentMatchDuration - currentPoint.currentMatchDuration) * 1000;

    setTimeout(() => {
        streamPointAndScheduleNext(res, pbpData, nextSet, nextGame, nextPoint);
    }, Math.max(delay, 0)); // guard against 0 or negative diffs
}