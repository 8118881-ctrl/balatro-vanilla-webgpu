import { screenCoordinate, vec3, vec2, length, float, mul, uv as tslUv, atan, sub, cos, sin, int, add, Loop, max, min, abs, div, vec4, Fn } from 'three/tsl';

export function balatroShader(iTime, iResolution) {
  const PIXEL_SIZE_FAC = float(700.0);
  const SPIN_EASE = float(0.5);
  const colour_1 = vec4(0.85, 0.2, 0.2, 1.0);
  const colour_2 = vec4(0.0, 156.0 / 255.0, 1.0, 1.0);
  const colour_3 = vec4(0.0, 0.0, 0.0, 1.0);
  const spin_amount = float(0.4);
  const contrast = float(1.5);

  return Fn(() => {
    const gl_FragCoord = vec3(screenCoordinate.x.mul(2), screenCoordinate.y.mul(2), screenCoordinate.z).toVar();
    const fragCoord = gl_FragCoord.xy.toVar();

    const pixel_size = length(iResolution).div(PIXEL_SIZE_FAC).toVar();
    const resTest = iResolution.div(2);
    const uv = vec2( fragCoord.xy.sub( mul( 2., iResolution.xy ) ).div( 3000.0 ) ).toVar();
    const uv_len = float( length( uv ) ).toVar();
    const speed = iTime.mul(SPIN_EASE).mul(0.1).add(302.2).toVar();

    const new_pixel_angle = atan(uv.y, uv.x)
      .add(speed.sub(SPIN_EASE.mul(20.0).mul(mul(1.0, spin_amount).mul(uv_len).add(sub(1.0, mul(1.0, spin_amount))))))
      .toVar();

    uv.assign(vec2(
      uv_len.mul(cos(new_pixel_angle)),
      uv_len.mul(sin(new_pixel_angle))
    ));

    uv.mulAssign(15.0);
    speed.assign(iTime.mul(1.0));

    const uv2 = vec2(uv.x.add(uv.y), uv.x.sub(uv.y)).toVar();

    Loop({ start: int(0), end: int(5) }, ({ i }) => {
      uv2.addAssign(uv.add(cos(length(uv))));
      uv.addAssign(mul(0.5, vec2(
        cos(add(5.1123314, mul(0.353, uv2.y)).add(speed.mul(0.131121))),
        sin(uv2.x.sub(mul(0.113, speed)))
      )));
      uv.subAssign(mul(1.0, cos(uv.x.add(uv.y))).sub(mul(1.0, sin(uv.x.mul(0.711).sub(uv.y)))));
    });

    const contrast_mod = mul(0.25, contrast).add(mul(0.5, spin_amount)).add(1.2).toVar();
    const paint_res = length(uv).mul(0.035).mul(contrast_mod).clamp(0.0, 2.0).toVar();

    const c1p = max(0.0, sub(1.0, contrast_mod.mul(abs(sub(1.0, paint_res))))).toVar();
    const c2p = max(0.0, sub(1.0, contrast_mod.mul(abs(paint_res)))).toVar();
    const c3p = sub(1.0, min(1.0, c1p.add(c2p))).toVar();

    const ret_col = vec4(
      div(0.3, contrast).mul(colour_1)
        .add(sub(1.0, div(0.3, contrast))
          .mul(colour_1.mul(c1p)
          .add(colour_2.mul(c2p))
          .add(vec4(c3p.mul(colour_3.rgb), c3p.mul(colour_1.a)))))
        .add(mul(0.3, max(c1p.mul(5.0).sub(4.0), 0.0)))
        .add(mul(0.4, max(c2p.mul(5.0).sub(4.0), 0.0)))
    ).toVar();

    return ret_col;
  });
}
