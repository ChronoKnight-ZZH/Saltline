import { QUALITY_PRESETS } from "./config.js";

function chooseQuality(i) {
  if (i && QUALITY_PRESETS[i])
    return {
      ...QUALITY_PRESETS[i],
    };
  if (
    /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 &&
      Math.min(screen.width, screen.height) < 900)
  )
    return {
      ...QUALITY_PRESETS.low,
    };
  let t = "";
  try {
    let s = document.createElement("canvas"),
      o = s.getContext("webgl2") || s.getContext("webgl");
    if (o) {
      let r = o.getExtension("WEBGL_debug_renderer_info");
      t = String(
        r
          ? o.getParameter(r.UNMASKED_RENDERER_WEBGL)
          : o.getParameter(o.RENDERER),
      );
      let a = o.getExtension("WEBGL_lose_context");
      a && a.loseContext();
    }
  } catch {}
  return {
    ...(/SwiftShader|llvmpipe|Software|Mali|Adreno|PowerVR/i.test(t) ||
    (/Intel/i.test(t) && !/Arc/i.test(t))
      ? QUALITY_PRESETS.medium
      : QUALITY_PRESETS.high),
  };
}

export { chooseQuality };
