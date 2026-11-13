function createEventBus() {
  let i = new Map();
  return {
    on(e, t) {
      return (i.has(e) || i.set(e, []), i.get(e).push(t), () => this.off(e, t));
    },
    off(e, t) {
      let n = i.get(e);
      if (n) {
        let s = n.indexOf(t);
        s >= 0 && n.splice(s, 1);
      }
    },
    emit(e, t) {
      let n = i.get(e);
      if (n)
        for (let s = 0; s < n.length; s++)
          try {
            n[s](t);
          } catch (o) {
            console.error(`[events] handler for "${e}" threw`, o);
          }
    },
  };
}

export { createEventBus };
