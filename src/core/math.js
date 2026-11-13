var clamp = (i, e, t) => Math.min(t, Math.max(e, i));

var lerp = (i, e, t) => i + (e - i) * t;

var saturate = (i) => Math.min(1, Math.max(0, i));

var smoothstep = (i, e, t) => {
  let n = saturate((t - i) / (e - i));
  return n * n * (3 - 2 * n);
};

var damp = (i, e, t, n) => e + (i - e) * Math.exp(-t * n);

export { clamp, lerp, saturate, damp, smoothstep };
