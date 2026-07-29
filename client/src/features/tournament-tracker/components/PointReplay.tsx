import { useEffect, useMemo, useRef, useState } from "react";
import type { Point } from "../types";
import type { BallPosition } from "../../../../../common/types";

/**
 * Replay of a point's ball flight, top-down (2D) or from behind the baseline (3D).
 *
 * Feed coordinates are already real court metres — origin at the net centre,
 * +x along the court's length, +y across it, +z up — so both views share one
 * coordinate space and differ only in the projection applied at render time.
 */

// court markings, metres from the net centre
const COURT = {
  baseline: 11.885,
  singles: 4.115,
  doubles: 5.485,
  serviceLine: 6.4,
  netHeight: 1.07,
};

const G = 9.81;
const BALL_R = 0.033; // metres — a ball overhanging the line is still in
// a few tracked peaks are junk (up to 16m); clamp so one bad point can't
// launch the ball out of frame
const MAX_Z = 8;
const PAD = 1.2;

// ── interpolation ────────────────────────────────────────────
// The feed gives ~5 samples per shot (hit-peak-net-bounce-peak), which is far
// too sparse to interpolate linearly in 3D — the ball would fly in visible
// straight segments and kink at each peak. Instead, split the flight at each
// contact (hit/bounce) and rebuild every arc ballistically: horizontal motion
// is constant-velocity, vertical follows gravity. The `peak` samples are then
// redundant, which conveniently also discards the bad ones.

interface Arc {
  a: BallPosition;
  b: BallPosition;
  T: number;
  v0: number; // initial vertical velocity that lands the ball on b
}

function buildArcs(path: BallPosition[]): Arc[] {
  const isAnchor = (p: BallPosition, i: number) =>
    i === 0 || i === path.length - 1 || p.at === "hit" || p.at === "bounce";
  const anchors = path.filter(isAnchor);

  const arcs: Arc[] = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const T = b.t - a.t;
    if (T <= 0) continue;
    arcs.push({ a, b, T, v0: (b.z - a.z + (G / 2) * T * T) / T });
  }
  return arcs;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function sampleAt(arcs: Arc[], t: number): Vec3 | null {
  if (arcs.length === 0) return null;
  const first = arcs[0];
  const last = arcs[arcs.length - 1];
  if (t <= first.a.t) return { x: first.a.x, y: first.a.y, z: first.a.z };
  if (t >= last.b.t) return { x: last.b.x, y: last.b.y, z: last.b.z };

  const arc = arcs.find((s) => t >= s.a.t && t <= s.b.t) ?? last;
  const tau = t - arc.a.t;
  const f = tau / arc.T;
  return {
    x: arc.a.x + (arc.b.x - arc.a.x) * f,
    y: arc.a.y + (arc.b.y - arc.a.y) * f,
    z: Math.max(
      0,
      Math.min(MAX_Z, arc.a.z + arc.v0 * tau - (G / 2) * tau * tau),
    ),
  };
}

// ── projection ───────────────────────────────────────────────

interface Pt2 {
  sx: number;
  sy: number;
}
type Project = (p: Vec3) => Pt2;

// The feed's +y and the screen's left/right run opposite ways, so the court
// renders mirrored (deuce/ad swapped) unless we flip the width axis.
const Y_FLIP = -1;

// top-down: length across the screen, height ignored
const projectTop: Project = ({ x, y }) => ({ sx: x, sy: Y_FLIP * y });

/**
 * Camera behind the baseline, raised and pitched down.
 *
 * Pitch is what opens up the far half of the court — height alone doesn't,
 * since with a level camera the near/far compression is fixed by distance and
 * nothing else. Height and pitch have to move together, though: pitching this
 * shallow from a high camera is *worse* than level, because the near court
 * swells to fill the frame.
 *
 * At 25° from x=-40 (19m up) this is a moderately compressed three-quarter
 * view: far enough back that the sidelines still converge gently (far baseline
 * ~61% the width of the near one), close enough that the court keeps real depth
 * and a 3m ball lifts ~1 unit off its shadow. z rises with distance so the 25°
 * sightline stays aimed at the court; the auto-fit viewBox handles the zoom.
 */
const CAM = { x: -40, y: 0, z: 19, pitchDeg: 25 };
const FOCAL = 16;

const PITCH = (CAM.pitchDeg * Math.PI) / 180;
const CP = Math.cos(PITCH);
const SP = Math.sin(PITCH);

// distance along the (pitched) optical axis; never divide by ~0
const depthOf = ({ x, z }: Vec3) =>
  Math.max(0.5, (x - CAM.x) * CP - (z - CAM.z) * SP);

const projectPerspective: Project = (p) => {
  const rx = p.x - CAM.x;
  const rz = p.z - CAM.z;
  const d = depthOf(p);
  return {
    sx: (Y_FLIP * (p.y - CAM.y) * FOCAL) / d,
    sy: (-(rx * SP + rz * CP) * FOCAL) / d,
  };
};

/**
 * How big to draw an object at that depth.
 *
 * Not the raw FOCAL/depth the projection uses — depth spans ~8.6m to ~36m
 * across the court, so true perspective sizing makes a near ball four times a
 * far one and it balloons over the baseline. Taking the geometric mean with a
 * reference depth keeps the cue but halves its range.
 */
const DEPTH_REF = 20;
const scaleAt = (p: Vec3, is3d: boolean) =>
  is3d ? FOCAL / Math.sqrt(depthOf(p) * DEPTH_REF) : 1;

// ── court geometry, as 3D segments ───────────────────────────

const seg = (a: Vec3, b: Vec3) => ({ a, b });
const v = (x: number, y: number, z = 0): Vec3 => ({ x, y, z });

const COURT_LINES = [
  // doubles perimeter
  seg(v(-COURT.baseline, -COURT.doubles), v(COURT.baseline, -COURT.doubles)),
  seg(v(-COURT.baseline, COURT.doubles), v(COURT.baseline, COURT.doubles)),
  seg(v(-COURT.baseline, -COURT.doubles), v(-COURT.baseline, COURT.doubles)),
  seg(v(COURT.baseline, -COURT.doubles), v(COURT.baseline, COURT.doubles)),
  // singles sidelines
  seg(v(-COURT.baseline, -COURT.singles), v(COURT.baseline, -COURT.singles)),
  seg(v(-COURT.baseline, COURT.singles), v(COURT.baseline, COURT.singles)),
  // service lines + centre line
  seg(
    v(-COURT.serviceLine, -COURT.singles),
    v(-COURT.serviceLine, COURT.singles),
  ),
  seg(
    v(COURT.serviceLine, -COURT.singles),
    v(COURT.serviceLine, COURT.singles),
  ),
  seg(v(-COURT.serviceLine, 0), v(COURT.serviceLine, 0)),
];

const NET_LINES = [
  seg(v(0, -COURT.doubles, 0), v(0, -COURT.doubles, COURT.netHeight)),
  seg(v(0, COURT.doubles, 0), v(0, COURT.doubles, COURT.netHeight)),
  seg(
    v(0, -COURT.doubles, COURT.netHeight),
    v(0, COURT.doubles, COURT.netHeight),
  ),
  seg(v(0, -COURT.doubles, 0), v(0, COURT.doubles, 0)),
];

/**
 * Raked stadium stands down both long sides, as static 3D line geometry
 * projected through the same camera. Purely decorative — they fill the bare
 * space beside the court. Kept deliberately sparse: horizontal tier lines plus
 * a few rake lines up the slope read as bleachers without any fill.
 */
// ATP Center Court: 66ft (20.11m) overall width vs a 36ft (10.97m) doubles
// court leaves 15ft (4.57m) of side-run clearance each side before any fixed
// obstruction — so the front row of stands sits exactly that far out.
const SIDE_RUN = 4.57;
const STAND = {
  front: COURT.doubles + SIDE_RUN, // front row at the ATP side-run limit
  rows: 5,
  rowDepth: 0.75, // metres outward per row
  rowRise: 0.55, // metres up per row
  frontZ: 0.2,
  len: COURT.baseline + 2.5, // runs a little past both baselines
};
const STAND_OUTER_Y = STAND.front + STAND.rows * STAND.rowDepth;
const STAND_TOP_Z = STAND.frontZ + STAND.rows * STAND.rowRise;

const STAND_LINES: { a: Vec3; b: Vec3 }[] = [-1, 1].flatMap((s) => {
  const tiers = Array.from({ length: STAND.rows + 1 }, (_, k) =>
    seg(
      v(-STAND.len, s * (STAND.front + k * STAND.rowDepth), STAND.frontZ + k * STAND.rowRise),
      v(STAND.len, s * (STAND.front + k * STAND.rowDepth), STAND.frontZ + k * STAND.rowRise),
    ),
  );
  const rakes = Array.from({ length: 7 }, (_, i) => {
    const x = -STAND.len + (2 * STAND.len * i) / 6;
    return seg(
      v(x, s * STAND.front, STAND.frontZ),
      v(x, s * STAND_OUTER_Y, STAND_TOP_Z),
    );
  });
  return [...tiers, ...rakes];
});

/**
 * Fixed framing envelope: the court plus a constant margin, at ground level and
 * up to typical shot height. The viewBox fits THIS, not each point's ball path,
 * so every point renders at the same zoom — otherwise a point whose ball flew
 * deep or high would shrink everything to fit and the framing would jump from
 * point to point. A ball (or the outer stand rows) that leaves this envelope
 * simply clips at the SVG edge — for the stands that's intended, since a
 * stadium naturally continues off-screen and it keeps the court prominent.
 */
const FRAME: Vec3[] = [
  ...[-1, 1].flatMap((sx) =>
    [-1, 1].map((sy) =>
      v(sx * (COURT.baseline + 2.5), sy * (COURT.doubles + 1.5), 0),
    ),
  ),
  // headroom over each baseline for arcs and the racquet follow-through
  ...[-1, 1].map((sx) => v(sx * (COURT.baseline + 2.5), 0, 3.2)),
];

function Court({ project, is3d }: { project: Project; is3d: boolean }) {
  const line = (
    s: { a: Vec3; b: Vec3 },
    i: number,
    stroke: string,
    w: number,
    opacity = 1,
  ) => {
    const a = project(s.a);
    const b = project(s.b);
    return (
      <line
        key={i}
        x1={a.sx}
        y1={a.sy}
        x2={b.sx}
        y2={b.sy}
        stroke={stroke}
        strokeWidth={w}
        opacity={opacity}
      />
    );
  };
  // strokes are in projected units; the 3D view is ~3x tighter than the 2D one
  const w = is3d ? 0.03 : 0.08;
  return (
    <g>
      {/* court markings carry the geometry, so they read brightest */}
      {COURT_LINES.map((s, i) => line(s, i, "var(--ink-2)", w * 1.15))}
      {/* the net is a landmark, not a boundary — it recedes */}
      {NET_LINES.map((s, i) => line(s, i + 100, "var(--mute)", w * 0.8, 0.5))}
    </g>
  );
}

// Static bleachers down both sides — 3D only (they'd read as a flat grid strip
// top-down). Faint and behind everything, purely to fill the bare sides.
function Stands({ project }: { project: Project }) {
  return (
    <g>
      {STAND_LINES.map((s, i) => {
        const a = project(s.a);
        const b = project(s.b);
        return (
          <line
            key={i}
            x1={a.sx}
            y1={a.sy}
            x2={b.sx}
            y2={b.sy}
            stroke="var(--stroke)"
            strokeWidth={0.022}
            opacity={0.6}
          />
        );
      })}
    </g>
  );
}

// ── component ────────────────────────────────────────────────

/** dense polyline so the rebuilt arcs render as curves, not chords */
const CURVE_STEPS = 160;

// swing window around contact, seconds. Both are well inside the shortest gap
// between contacts in the data (0.65s), so two swings never overlap.
const SWING_BACK = 0.16;
const SWING_FWD = 0.26;
const SWING_ARC = (62 * Math.PI) / 180; // half-sweep, backswing to follow-through
const REACH = 0.8; // metres, pivot to head centre

// Topspin is a low-to-high swing: the racquet drops under the ball, brushes up
// the back of it, and finishes high. Asymmetric on purpose — the drop is short,
// the finish is long and well above the contact point.
const DROP = 0.5; // metres below contact at the end of the backswing
const LIFT = 1.15; // metres above contact at the end of the follow-through
const rise = (th: number) => ((th >= 0 ? LIFT : DROP) * th) / SWING_ARC;

/**
 * Angle of the racquet at `tau` seconds relative to contact: negative behind,
 * zero exactly at contact, positive through the follow-through.
 *
 * The exponent below 1 is what makes it read as a swing — head speed peaks at
 * contact, so the racquet loads slowly at the extremes and snaps through the
 * middle, instead of sliding around at a constant rate.
 */
function swingAngle(tau: number): number {
  const span = tau < 0 ? SWING_BACK : SWING_FWD;
  const f = Math.min(1, Math.abs(tau) / span);
  return Math.sign(tau) * SWING_ARC * Math.pow(f, 0.55);
}

function swingOpacity(tau: number): number {
  const v =
    tau < 0
      ? (tau + SWING_BACK) / (SWING_BACK * 0.6) // fade in on the backswing
      : 1 - Math.max(0, tau - SWING_FWD * 0.3) / (SWING_FWD * 0.7);
  return Math.max(0, Math.min(1, v));
}

/**
 * A racquet swung through the contact point.
 *
 * The head sweeps a horizontal arc about a pivot set one reach to the player's
 * racquet side, so at tau=0 the head is exactly on the ball. Forehand swings on
 * the racquet side, backhand across the body — and which screen side that is
 * flips with the end of the court they're standing at.
 */
function Racquet({
  span,
  tau,
  project,
  is3d,
  colour,
}: {
  span: { hand: string; at: Vec3 };
  tau: number;
  project: Project;
  is3d: boolean;
  colour: string;
}) {
  const { hand, at } = span;
  // the feed never classifies serve hand ("NA"), so don't invent one
  if (hand !== "ForeHand" && hand !== "BackHand") return null;

  const facing = at.x < 0 ? 1 : -1; // the direction they're hitting toward
  // Y_FLIP keeps forehand/backhand on the correct screen side: the racquet is
  // positioned in world y then projected, so it inherits the width-axis flip.
  const side = (hand === "ForeHand" ? 1 : -1) * facing * Y_FLIP;
  const pivot = { x: at.x, y: at.y - side * REACH, z: at.z };

  // a point `r` out from the pivot, at swing angle `th`. The z term is the
  // topspin brush — zero at contact, so the head still meets the ball exactly.
  const arm = (r: number, th: number): Vec3 => ({
    x: pivot.x + facing * r * Math.sin(th),
    y: pivot.y + side * r * Math.cos(th),
    // never let the head sink through the court on a low contact
    z: Math.max(0.05, pivot.z + rise(th) * (r / REACH)),
  });

  // Proportions follow a real racquet: ~34cm head, ~43cm grip.
  //
  // The grip's top end is placed a fixed distance down the racquet's true 3D
  // axis rather than at a fraction of the swing radius. Those differ once the
  // topspin rise is in play — it adds a z offset between head and grip that
  // makes their real separation exceed the head's half-length, and the head
  // visibly detaches at the top of the follow-through.
  // Head and grip are close to equal length on a real racquet. The butt sits
  // at 0.45 of the reach — everything inside that is the player's arm, which
  // isn't drawn.
  const th = swingAngle(tau);
  const headP = arm(REACH, th);
  const buttP = arm(REACH * 0.45, th);
  const axis = {
    x: headP.x - buttP.x,
    y: headP.y - buttP.y,
    z: headP.z - buttP.z,
  };
  const len = Math.hypot(axis.x, axis.y, axis.z) || 1;
  const HEAD_HALF = 0.22; // metres — half the head's long axis

  const head = project(headP);
  const gripA = project({
    x: headP.x - (axis.x / len) * HEAD_HALF * 0.5,
    y: headP.y - (axis.y / len) * HEAD_HALF * 0.5,
    z: headP.z - (axis.z / len) * HEAD_HALF * 0.5,
  });
  const gripB = project(buttP);
  const k = scaleAt(headP, is3d);

  // the head's long axis follows the grip, so align the ellipse to it
  const deg =
    (Math.atan2(head.sy - gripB.sy, head.sx - gripB.sx) * 180) / Math.PI;

  // trace of where the head has already swung — the motion cue
  const trace: string = Array.from({ length: 14 }, (_, i) => {
    const a = -SWING_ARC + ((th + SWING_ARC) * i) / 13;
    const p = project(arm(REACH, a));
    return `${p.sx},${p.sy}`;
  }).join(" ");

  return (
    <g opacity={swingOpacity(tau)} fill="none" strokeLinecap="round">
      <polyline
        points={trace}
        stroke={colour}
        strokeWidth={0.05 * k}
        opacity={0.35}
      />
      <line
        x1={gripA.sx}
        y1={gripA.sy}
        x2={gripB.sx}
        y2={gripB.sy}
        stroke={colour}
        strokeWidth={0.06 * k}
      />
      <ellipse
        cx={head.sx}
        cy={head.sy}
        rx={HEAD_HALF * k}
        ry={0.16 * k}
        stroke={colour}
        strokeWidth={0.05 * k}
        transform={`rotate(${deg} ${head.sx} ${head.sy})`}
      />
    </g>
  );
}

export function PointReplay({
  points,
  focusId,
}: {
  points: Point[];
  focusId?: string;
}) {
  // open on the requested point if it's in the list, else the first
  const [sel, setSel] = useState(() => {
    const i = points.findIndex((p) => p.id === focusId);
    return i >= 0 ? i : 0;
  });
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [is3d, setIs3d] = useState(true);

  const point = points[sel];

  const { arcs, duration, spans, bounces } = useMemo(() => {
    const shots = point?.rally?.shots ?? [];
    const path = shots
      .flatMap((s) => s.path)
      .slice()
      .sort((a, b) => a.t - b.t);
    const arcs = buildArcs(path);
    const duration = arcs.length ? arcs[arcs.length - 1].b.t : 0;
    // A shot owns the flight from its own contact to the next one, so the
    // spans butt up against each other with no gaps to fall into.
    const spans = shots.map((s, i) => ({
      index: s.index,
      hand: s.isServe ? "SERVE" : (s.hand ?? "—"),
      t0: s.t,
      t1: shots[i + 1]?.t ?? duration,
      // racquet contact — where the hand indicator is drawn
      at: s.path[0] ?? { x: 0, y: 0, z: 0 },
    }));
    // Where the ball landed. Judged against the singles court, and generous by
    // a ball radius — a ball touching the line is in, and the feed's ace lands
    // 2mm outside the sideline, which a strict comparison would call out.
    const bounces = path
      .filter((p) => p.at === "bounce")
      .map((p, i) => ({
        n: i + 1,
        x: p.x,
        y: p.y,
        t: p.t,
        out:
          Math.abs(p.y) > COURT.singles + BALL_R ||
          Math.abs(p.x) > COURT.baseline + BALL_R,
      }));
    return { arcs, duration, spans, bounces };
  }, [point]);

  const project = is3d ? projectPerspective : projectTop;

  // the whole flight, densely sampled once per point/projection
  const curve = useMemo(() => {
    if (!duration) return [] as { p: Vec3; s: Pt2; t: number }[];
    return Array.from({ length: CURVE_STEPS + 1 }, (_, i) => {
      const ti = (duration * i) / CURVE_STEPS;
      const p = sampleAt(arcs, ti)!;
      return { p, s: project(p), t: ti };
    });
  }, [arcs, duration, project]);

  // Fixed framing: fit the constant FRAME envelope, not the ball path, so every
  // point renders at the same zoom (see FRAME). Depends only on the camera.
  const view = useMemo(() => {
    const pts = FRAME.map(project);
    const xs = pts.map((p) => p.sx);
    const ys = pts.map((p) => p.sy);
    const x0 = Math.min(...xs) - PAD;
    const y0 = Math.min(...ys) - PAD;
    const w = Math.max(...xs) - x0 + PAD;
    const h = Math.max(...ys) - y0 + PAD;
    return { box: `${x0} ${y0} ${w} ${h}`, aspect: w / h };
  }, [project]);

  useEffect(() => {
    setT(0);
    setPlaying(false);
  }, [sel]);

  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, [playing, speed, duration]);

  if (!point) return null;

  // the stroke currently in flight — the only arc drawn at full strength
  const shot = spans.filter((s) => s.t0 <= t).at(-1) ?? spans[0];
  const ball = sampleAt(arcs, t);
  const ballS = ball ? project(ball) : null;
  const shadowS = ball ? project({ ...ball, z: 0 }) : null;
  const ballScale = ball ? scaleAt(ball, is3d) : 1;

  const path = (list: Pt2[]) => list.map((p) => `${p.sx},${p.sy}`).join(" ");
  const stroke = is3d ? 0.04 : 0.1;
  // a circle lying flat on the court foreshortens to an ellipse; its vertical
  // axis compresses by ~sin(pitch) in 3D, none in the top-down 2D view
  const GROUND_SQUASH = is3d ? SP : 1;

  const btn = {
    padding: "4px 10px",
    borderRadius: 5,
    border: "1px solid var(--stroke)",
    background: "var(--paper)",
    color: "var(--ink)",
    fontSize: 11,
    cursor: "pointer",
  } as const;

  return (
    <div style={{ background: "var(--paper)", padding: "12px 16px 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>Point replay</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--mute)" }}>
          {point.id} · {point.result} ·{" "}
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            {shot ? `${shot.index + 1}/${spans.length} ${shot.hand}` : "—"}
          </span>
        </span>
      </div>

      <div
        className="hscroll"
        style={{ display: "flex", gap: 4, marginBottom: 8 }}
      >
        {points.map((p, i) => (
          <div
            key={p.id}
            onClick={() => setSel(i)}
            className="mono"
            style={{
              flex: "0 0 auto",
              padding: "3px 8px",
              borderRadius: 5,
              fontSize: 10,
              cursor: "pointer",
              background: i === sel ? "var(--sel)" : "transparent",
              color: i === sel ? "var(--sel-ink)" : "var(--mute)",
              border: "1px solid var(--stroke)",
            }}
          >
            {p.id.split("_")[2]} · {p.result}
          </div>
        ))}
      </div>

      <svg
        viewBox={view.box}
        style={{
          width: "100%",
          aspectRatio: String(view.aspect),
          display: "block",
          background: "var(--bg)",
          borderRadius: 6,
        }}
      >
        {is3d && <Stands project={project} />}
        <Court project={project} is3d={is3d} />

        {/* full flight, faint */}
        <polyline
          points={path(curve.map((c) => c.s))}
          fill="none"
          stroke="var(--stroke)"
          strokeWidth={stroke * 0.7}
          strokeDasharray={`${stroke * 3} ${stroke * 3}`}
        />

        {/* ground track — where the ball is over the court, height removed.
            2D only: in 3D the sole trajectory line should be the ball's actual
            path through the air, not its shadow on the court. */}
        {!is3d && (
          <polyline
            points={path(curve.map((c) => project({ ...c.p, z: 0 })))}
            fill="none"
            stroke="var(--mute)"
            strokeWidth={stroke * 0.5}
            opacity={0.4}
          />
        )}

        {/* earlier shots stay visible but recede */}
        <polyline
          points={path(curve.filter((c) => c.t <= t).map((c) => c.s))}
          fill="none"
          stroke="var(--accent-ink)"
          strokeWidth={stroke * 0.6}
          opacity={0.22}
        />

        {/* bounce marks — a dot where the ball landed, red if out */}
        {bounces.map((b) => {
          const s = project({ x: b.x, y: b.y, z: 0 });
          const k = scaleAt({ x: b.x, y: b.y, z: 0 }, is3d);
          return (
            <circle
              key={b.n}
              cx={s.sx}
              cy={s.sy}
              r={0.07 * k}
              fill={b.out ? "var(--hot)" : "var(--accent)"}
              opacity={b.t <= t ? 1 : 0.3}
            />
          );
        })}

        {/* racquet swings through each contact, loading just before it */}
        {spans.map((sp) => {
          const tau = t - sp.t0;
          if (tau < -SWING_BACK || tau > SWING_FWD) return null;
          return (
            <Racquet
              key={sp.index}
              span={sp}
              tau={tau}
              project={project}
              is3d={is3d}
              colour="var(--accent)"
            />
          );
        })}

        {/* the shot in flight — the only arc at full strength */}
        {shot && (
          <polyline
            points={path(
              curve
                .filter((c) => c.t >= shot.t0 && c.t <= Math.min(t, shot.t1))
                .map((c) => c.s),
            )}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={stroke * 1.3}
            strokeLinecap="round"
          />
        )}

        {ball && ballS && shadowS && (
          <>
            {/* drop line ball -> court, dashed so it reads as a plumb line */}
            <line
              x1={ballS.sx}
              y1={ballS.sy}
              x2={shadowS.sx}
              y2={shadowS.sy}
              stroke="var(--accent)"
              strokeWidth={stroke * 0.5}
              strokeDasharray={`${stroke * 1.5} ${stroke * 1.5}`}
              opacity={0.55}
            />
            {/* ground projection — a highlighted spot tracking the ball over the
                court. Soft disc for contrast, a crisp ring, and a centre dot. */}
            <ellipse
              cx={shadowS.sx}
              cy={shadowS.sy}
              rx={0.32 * ballScale}
              ry={0.32 * ballScale * GROUND_SQUASH}
              fill="var(--ink)"
              opacity={0.28}
            />
            <ellipse
              cx={shadowS.sx}
              cy={shadowS.sy}
              rx={0.3 * ballScale}
              ry={0.3 * ballScale * GROUND_SQUASH}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={stroke * 0.7}
              opacity={0.9}
            />
            <ellipse
              cx={shadowS.sx}
              cy={shadowS.sy}
              rx={0.07 * ballScale}
              ry={0.07 * ballScale * GROUND_SQUASH}
              fill="var(--accent)"
            />
            {/* tennis ball: yellow with the darker seam shade as its rim */}
            <circle
              cx={ballS.sx}
              cy={ballS.sy}
              r={0.12 * ballScale}
              fill="var(--accent)"
              stroke="var(--accent-ink)"
              strokeWidth={0.05 * ballScale}
            />
          </>
        )}
      </svg>

      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}
      >
        <button
          style={btn}
          onClick={() => {
            if (t >= duration) setT(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          style={btn}
          onClick={() => {
            setT(0);
            setPlaying(false);
          }}
        >
          ↺
        </button>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
          style={{ flex: 1 }}
        />
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--mute)",
            minWidth: 60,
            textAlign: "right",
          }}
        >
          {t.toFixed(2)}/{duration.toFixed(2)}s
        </span>
        <button
          style={btn}
          onClick={() =>
            setSpeed((s) => (s === 1 ? 0.5 : s === 0.5 ? 0.25 : 1))
          }
        >
          {speed}×
        </button>
        <button style={btn} onClick={() => setIs3d((d) => !d)}>
          {is3d ? "3D" : "2D"}
        </button>
      </div>
    </div>
  );
}

/** points belonging to the last game in the list — dev scaffold */
export function lastGamePoints(points: Point[]): Point[] {
  const last = points[points.length - 1];
  if (!last) return [];
  const game = last.id.split("_").slice(0, 2).join("_");
  return points.filter((p) => p.id.startsWith(`${game}_`));
}
