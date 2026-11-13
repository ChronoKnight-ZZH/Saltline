import { Matrix4, ShaderChunk, Vector3 } from "../vendor/three-r180.js";
import { SUN_LIGHT } from "../core/config.js";

var SHADOW_SHADER_MARKER = "// SALTLINE_SHADOW";

var xf = null;

function Gy(i, e, t, n, s) {
  let o = SUN_LIGHT.dir.clone().normalize(),
    r = e.clone().add(t).multiplyScalar(0.5);
  (i.target.position.copy(r),
    i.position.copy(r).addScaledVector(o, 200),
    i.updateMatrixWorld(!0),
    i.target.updateMatrixWorld(!0));
  let a = new Matrix4().lookAt(i.position, r, new Vector3(0, 1, 0));
  (a.setPosition(i.position), a.invert());
  let l = new Vector3(),
    c = 1 / 0,
    u = -1 / 0,
    h = 1 / 0,
    f = -1 / 0,
    p = 1 / 0,
    d = -1 / 0,
    v = (y, b, m) => {
      for (let A = 0; A < 8; A++)
        (l
          .set(A & 1 ? b.x : y.x, A & 2 ? b.y : y.y, A & 4 ? b.z : y.z)
          .applyMatrix4(a),
          m(l));
    };
  (v(e, t, (y) => {
    ((c = Math.min(c, y.x)),
      (u = Math.max(u, y.x)),
      (h = Math.min(h, y.y)),
      (f = Math.max(f, y.y)),
      (p = Math.min(p, -y.z)),
      (d = Math.max(d, -y.z)));
  }),
    v(n, s, (y) => {
      p = Math.min(p, -y.z);
    }));
  let g = i.shadow.camera,
    x = 1;
  return (
    (g.left = c - x),
    (g.right = u + x),
    (g.bottom = h - x),
    (g.top = f + x),
    (g.near = Math.max(1, p - 4)),
    (g.far = d + 4),
    g.updateProjectionMatrix(),
    {
      width: g.right - g.left,
      height: g.top - g.bottom,
      depth: g.far - g.near,
    }
  );
}

function installSoftShadows(i, { taps: e = 16, searchTaps: t = 8 } = {}) {
  let n = ShaderChunk.shadowmap_pars_fragment;
  xf === null && (xf = n);
  let s = xf,
    o = s.indexOf("float getShadow("),
    r = s.indexOf("vec2 cubeToUV"),
    a = s.lastIndexOf("// cubeToUV()", r);
  if ((a < o && (a = r), o < 0 || r < 0 || r < o))
    return (
      console.warn(
        "[render] soft shadows: unexpected Three shader chunk layout, keeping stock PCF",
      ),
      !1
    );
  let l = `
	${SHADOW_SHADER_MARKER}
	const vec2 SL_FRUSTUM = vec2( ${i.width.toFixed(3)}, ${i.height.toFixed(3)} );   // metres across the shadow map
	const float SL_DEPTH = ${i.depth.toFixed(3)};                                       // metres across the depth range
	float slIGN( vec2 p ) { return fract( 52.9829189 * fract( dot( p, vec2( 0.06711056, 0.00583715 ) ) ) ); }
	vec2 slVogel( int i, int n, float phi ) {
		float r = sqrt( ( float( i ) + 0.5 ) / float( n ) );
		float th = float( i ) * 2.39996323 + phi;
		return r * vec2( cos( th ), sin( th ) );
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		shadowCoord.xyz /= shadowCoord.w;
		vec3 sc = shadowCoord.xyz;
		vec3 dx = dFdx( sc ), dy = dFdy( sc );
		bool inFrustum = sc.x >= 0.0 && sc.x <= 1.0 && sc.y >= 0.0 && sc.y <= 1.0;
		if ( ! ( inFrustum && sc.z <= 1.0 ) ) return 1.0;
		// receiver plane depth bias: depth gradient of the receiver in shadow-map uv space
		float det = dx.x * dy.y - dx.y * dy.x;
		vec2 dz = vec2( 0.0 );
		if ( abs( det ) > 1e-12 ) dz = vec2( dy.y * dx.z - dx.y * dy.z, dx.x * dy.z - dy.x * dx.z ) / det;
		vec2 texel = 1.0 / shadowMapSize;
		float maxSlope = 0.0030 / max( texel.x, texel.y );      // never bias more than ~0.6 m per kernel
		dz = clamp( dz, vec2( - maxSlope ), vec2( maxSlope ) );
		float zr = sc.z + shadowBias - ( abs( dz.x ) * texel.x + abs( dz.y ) * texel.y ) * 0.35;
		float phi = slIGN( gl_FragCoord.xy ) * 6.2831853;
		// --- blocker search ---
		vec2 searchR = ( 0.55 * shadowRadius ) / SL_FRUSTUM;     // metres -> uv
		float blk = 0.0, nb = 0.0;
		for ( int i = 0; i < ${t}; i ++ ) {
			vec2 o = slVogel( i, ${t}, phi ) * searchR;
			float d = unpackRGBAToDepth( texture2D( shadowMap, sc.xy + o ) );
			float z = zr + dot( o, dz );
			if ( d < z ) { blk += d; nb += 1.0; }
		}
		if ( nb < 0.5 ) return 1.0;
		float avg = blk / nb;
		// --- penumbra: grows with blocker distance (sun half-angle scaled up for look) ---
		float distM = max( zr - avg, 0.0 ) * SL_DEPTH;
		float penM = clamp( distM * 0.022 * shadowRadius, 0.012 * shadowRadius, 0.60 * shadowRadius );
		vec2 filtR = max( vec2( penM ) / SL_FRUSTUM, texel * 1.25 );
		float lit = 0.0;
		for ( int i = 0; i < ${e}; i ++ ) {
			vec2 o = slVogel( i, ${e}, phi + 1.7 ) * filtR;
			float d = unpackRGBAToDepth( texture2D( shadowMap, sc.xy + o ) );
			lit += step( zr + dot( o, dz ), d );
		}
		lit /= float( ${e} );
		// fade to lit at the very edge of the map so the frustum border never shows
		vec2 e = min( sc.xy, 1.0 - sc.xy );
		lit = mix( 1.0, lit, smoothstep( 0.0, 0.02, min( e.x, e.y ) ) );
		return mix( 1.0, lit, shadowIntensity );
	}

	`;
  return (
    (ShaderChunk.shadowmap_pars_fragment = s.slice(0, o) + l + s.slice(a)),
    !0
  );
}

function Xy() {
  xf !== null && (ShaderChunk.shadowmap_pars_fragment = xf);
}

var Yy = SHADOW_SHADER_MARKER;

export { Gy, installSoftShadows, Xy, Yy, SHADOW_SHADER_MARKER };
