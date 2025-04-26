import {
  uniform,
  float,
  vec2,
  vec3,
  vec4,
  uv,
  texture,
  dot,
  smoothstep,
  select,
  bool,
  mix,
  sub,
  clamp,
  fract,
  abs,
  atan,
  cos,
  sin,
  length,
  mul,
  Fn,
  Discard,
  If,
} from "three/tsl";

export function polychromeShader(tex, uTimeUniform, uRotationUniform) {
  return Fn(() => {
    
    const rgb2hsv = /*#__PURE__*/ Fn(([c_immutable]) => {
      const c = vec3(c_immutable).toVar();
      const K = vec4(0, float(-1).div(3), 2 / 3, float(-1)).toVar();
      const p = vec4(
        mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g)),
      ).toVar();
      const q = vec4(
        mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r)),
      ).toVar();
      const d = float(q.x.sub(min(q.w, q.y))).toVar();
      const e = float(1.0e-10).toVar();

      return vec3(
        abs(q.z.add(q.w.sub(q.y).div(mul(6, d).add(e)))),
        d.div(q.x.add(e)),
        q.x,
      );
    }).setLayout({
      name: "rgb2hsv",
      type: "vec3",
      inputs: [{ name: "c", type: "vec3" }],
    });

    const hsv2rgb = /*#__PURE__*/ Fn(([c_immutable]) => {
      const c = vec3(c_immutable).toVar();
      const p = vec3(
        abs(
          fract(c.xxx.add(vec3(0, 1 / 3, 2 / 3)))
            .mul(6)
            .sub(3),
        ),
      ).toVar();

      return c.z.mul(mix(vec3(1), clamp(p.sub(1), 0, 1), c.y));
    }).setLayout({
      name: "hsv2rgb",
      type: "vec3",
      inputs: [{ name: "c", type: "vec3" }],
    });
    
    const baseCenter = vec2(0.5, 0.8).toVar();
    const twirlCenter = vec2(baseCenter).add(uRotationUniform).toVar();
    const offset = vec2(uv().sub(twirlCenter)).toVar();
    const radius = float(length(offset)).toVar();
    const angle = float(atan(offset.y, offset.x)).toVar();
    const twist = float(mul(10, radius)).toVar();
    const twistAngle = float( angle.add( uTimeUniform ).add( twist ) ).toVar();
    const twistedUV = vec2(
      vec2(cos(twistAngle), sin(twistAngle)).mul(radius).add(twirlCenter),
    ).toVar();

    const t = texture(tex);
    const invertedTexture = vec3( sub( 1.0, t.r ), sub( 1.0, t.g ), sub( 1.0, t.b ) ).toVar();
    
    const hue = float( fract( twistAngle.div( 2.0 * 3.141592 ) ) ).toVar();
   	const saturation = float( 1. ).toVar();
   	const brightness = float( 1.0 ).toVar();
   	const color = vec3( hsv2rgb( vec3( hue, saturation, brightness ) ) ).toVar();
   	color.r.mulAssign( 1.81 );
   	color.g.mulAssign( 0.85 );
   	color.b.mulAssign( 1.27 );
    const texBrightness = float( dot( t.rgb, vec3( 0.299, 0.587, 0.114 ) ) ).toVar();
   	const blendStrength = float( smoothstep( 0., 1., texBrightness ) ).toVar();
   	// const brightnessBoost = float( select( invertedTexture.b.greaterThan( 0.1 ), 6., 1.0 ) ).toVar();
   	const shouldBeTransparent = bool( invertedTexture.b.lessThan( 0.01 ).or( invertedTexture.r.lessThan( 0.01 ) ).or( invertedTexture.g.lessThan( 0.01 ) ) ).toVar();
    const finalColor = vec3(t.rgb).mul(1.).add(color).toVar();
    
   	If(shouldBeTransparent, () => {
   
  		finalColor.assign( mix( t.rgb, color, blendStrength.mul( 0.1) ) );
      
      
 	} );
    

    if (t.a < 0.1) {
      Discard();
    }

    return vec4(finalColor, t.a);
  });
}
