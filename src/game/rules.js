// World coordinates are measured in arena units. Positive Y points up.
export const ARENA = Object.freeze({ halfWidth: 52, halfHeight: 31 });
export const STEP = 1 / 60;
export const TAU = Math.PI * 2;
export const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
export const N = Object.freeze({
  hunter: { radius: .88, hp: 1, value: 80, color: 0x45cfff },
  spinner: { radius: 1.02, hp: 2, value: 125, color: 0xfc54bc },
  stalker: { radius: .88, hp: 2, value: 180, color: 0xc1fc52 },
  snake: { radius: 1.04, hp: 4, value: 320, color: 0xffac31 },
  well: { radius: 1.75, hp: 10, value: 600, color: 0xff9055 }
});
export const WEAPONS = [
  { name: 'Pulse lance', score: 0, interval: .127, angles: [0] },
  { name: 'Twin lance', score: 1500, interval: .124, angles: [-.026, .026] },
  { name: 'Trident', score: 4500, interval: .118, angles: [-.135, 0, .135] },
  { name: 'Nova array', score: 12000, interval: .105, angles: [-.18, -.05, .05, .18] }
];
export const PULSE_RADIUS = ARENA.halfWidth * 1.36;
export const PULSE_DURATION = 1.08;
export const PULSE_TIME = 12;
export const clock = n => String(Math.floor(n / 60)).padStart(2,'0') + ':' + String(Math.floor(n % 60)).padStart(2,'0');
export const digits = n => String(Math.floor(n)).padStart(6,'0');
export function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
