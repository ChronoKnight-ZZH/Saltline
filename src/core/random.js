function createRandom(i = 1337) {
  let e = i >>> 0,
    t = () => {
      ((e |= 0), (e = (e + 1831565813) | 0));
      let n = Math.imul(e ^ (e >>> 15), 1 | e);
      return (
        (n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n),
        ((n ^ (n >>> 14)) >>> 0) / 4294967296
      );
    };
  return (
    (t.range = (n, s) => n + (s - n) * t()),
    (t.int = (n, s) => Math.floor(n + (s - n + 1) * t())),
    (t.pick = (n) => n[Math.floor(t() * n.length)]),
    (t.sign = () => (t() < 0.5 ? -1 : 1)),
    (t.fork = () => createRandom(Math.floor(t() * 4294967296))),
    t
  );
}

export { createRandom };
