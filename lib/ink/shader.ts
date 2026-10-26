export const FRAGMENT_SHADER = `
precision highp float;
#define MAXR 4
uniform vec2 uView; uniform float uDpr, uTime, uScroll, uCount;
uniform vec4 uRect[MAXR]; uniform vec4 uOrig[MAXR]; uniform vec4 uSt[MAXR]; uniform vec4 uSt2[MAXR];
uniform vec4 uCore[MAXR]; uniform vec4 uLight[MAXR]; uniform vec4 uMRect[MAXR]; uniform vec4 uPhase[MAXR];
uniform vec3 uPalA[MAXR]; uniform vec3 uPalB[MAXR];
uniform vec2 uTexAR; uniform sampler2D uTex0; uniform float uFade[MAXR];
uniform vec4 uDrop; uniform vec3 uDropInk; uniform vec3 uTrail[6];
uniform sampler2D uType; uniform vec4 uTypeP; uniform vec3 uTypeCur; uniform float uVid;
uniform sampler2D uPhoto; uniform vec4 uAtlas[MAXR];
uniform float uMorph; uniform float uMask[MAXR];

vec2 hash2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
float hash1(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(dot(hash2(i),f),dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x), mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)),dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y); }
float fbm(vec2 p){ float s=0.0,a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ s+=a*noise(p); p=m*p; a*=0.5; } return s; }
float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.0))+min(max(d.x,d.y),0.0); }
float smin(float a,float b,float k){ float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0); return mix(b,a,h)-k*h*(1.0-h); }
vec3 fluid(vec2 uv, float seed, vec3 A, vec3 B, vec3 C){
  vec2 p=uv*2.2+seed; float t=uTime*0.045;
  vec2 q=vec2(fbm(p+vec2(0.0,t)), fbm(p+vec2(5.2,1.3)-t));
  vec2 r=vec2(fbm(p+3.2*q+vec2(1.7,9.2)+t*1.3), fbm(p+3.2*q+vec2(8.3,2.8)-t*0.8));
  float f=fbm(p+3.2*r)*0.9+0.5;
  vec3 col=mix(vec3(0.03,0.02,0.04), A, smoothstep(0.3,0.85,f));
  col=mix(col, B, smoothstep(0.15,0.75,length(q))*0.8);
  col=mix(col, C, smoothstep(0.05,0.5,r.y)*0.72);
  col=mix(col, vec3(1.0,0.97,0.94), smoothstep(0.35,0.62,r.x)*0.3);
  return col*(0.6+1.0*f*f);
}
vec3 treatImg(vec3 img, vec3 deep, vec3 lit, float mott){
  float l=dot(img,vec3(0.299,0.587,0.114));
  vec3 duo=mix(deep*0.85, lit, smoothstep(0.06,0.72,l));
  duo=mix(duo, vec3(0.98,0.96,0.93), smoothstep(0.74,1.0,l)*0.75);
  return duo*(0.93+0.1*mott);
}
void main(){
  vec2 fc=vec2(gl_FragCoord.x, uView.y*uDpr-gl_FragCoord.y)/uDpr;
  vec2 wp=vec2(fc.x, fc.y+uScroll);
  float grain=noise(fc*0.45);
  vec4 acc=vec4(0.0);
  float mkey=-1.0; vec3 mcache=vec3(0.0);

  // ---- spilled-type hero: letters filled with footage that bleed toward the cursor and flood on scroll ----
  if(uTypeP.y>0.004){
    vec2 tuv=fc/uView;
    vec3 tm=texture2D(uType,tuv).rgb;
    float p=uTypeP.x;
    float n=fbm(wp/90.0+vec2(uTime*0.02,0.0));
    float hr=noise(fc*0.09);
    float v=mix(tm.r, mix(tm.g*1.3, tm.b*2.3, smoothstep(0.35,1.0,p)), smoothstep(0.0,0.35,p));
    v=max(v, tm.r);
    v+=n*(0.12+0.3*p)+hr*0.05;
    vec2 dcur=fc-uTypeCur.xy;
    v+=exp(-dot(dcur,dcur)/(160.0*160.0))*0.6*uTypeCur.z*smoothstep(0.03,0.35,tm.b);
    v+=pow(p,3.0)*1.5;
    float ta=smoothstep(0.47,0.53,v);
    float comb=noise(fc*vec2(0.02,0.12)+uTime*0.05)*0.5+0.5;
    float tf=smoothstep(0.30,0.47,v)*(1.0-ta)*0.5*(0.35+0.65*comb);
    float q=uTypeP.z;
    if(q>0.0){ float Rq=(1.0-q)*length(uView)*0.62; float dd=length(fc-uView*0.5)+n*140.0; float m=1.0-smoothstep(Rq-30.0,Rq+30.0,dd); ta*=m; tf*=m; }
    ta*=uTypeP.y; tf*=uTypeP.y;
    if(ta+tf>0.003){
      float gx=clamp(fc.x/uView.x,0.0,1.0);
      vec3 RED=vec3(0.933,0.184,0.153), GRN=vec3(0.471,0.757,0.271), BLU=vec3(0.118,0.561,0.839);
      vec3 edge=gx<0.5?mix(RED,GRN,gx*2.0):mix(GRN,BLU,(gx-0.5)*2.0);
      vec3 ic=edge;
      if(ta>0.003){
        float depth=smoothstep(0.53,0.85,v);
        vec3 media;
        if(uVid>0.5){ float rar=uView.x/uView.y; vec2 s=tuv-0.5; if(rar>uTexAR.x) s.y*=uTexAR.x/rar; else s.x*=rar/uTexAR.x; media=texture2D(uTex0,s+0.5).rgb; }
        else media=fluid(tuv*vec2(uView.x/uView.y,1.0), 3.7, BLU, RED, GRN);
        ic=mix(edge*0.9, media, depth);
      }
      vec3 fcl=mix(edge,vec3(1.0),0.2);
      acc=vec4(ic*ta+fcl*tf, ta+tf);
    }
  }
  for(int i=0;i<MAXR;i++){
    if(float(i)>=uCount) break;
    vec4 rc=uRect[i]; vec4 o=uOrig[i]; vec4 st=uSt[i]; vec4 s2=uSt2[i]; vec4 ph4=uPhase[i];
    float R=o.z;
    vec2 rel=fc-o.xy; float len=length(rel); vec2 dir=rel/max(len,0.001);
    vec2 bp=fc-(rc.xy+rc.zw*0.5);
    float rad=min(rc.z,rc.w)*abs(ph4.z);
    if(ph4.z<0.0 && bp.x>0.0 && bp.y<0.0) rad=0.0;   // negative radius: square top-right corner
    float d0=max(len-R, sdBox(bp, rc.zw*0.5-rad)-rad);
    float sc=clamp(R/360.0,0.04,1.6);
    float lobeAmp=uLight[i].a;
    float feather=s2.x*sc;
    float fwMax=(26.0+140.0*ph4.x)*sc+6.0;
    if(d0 > (st.x*1.6+st.y+st.z*1.8)*sc+lobeAmp*min(sc,1.0)+max(feather,fwMax)+4.0) continue;
    vec2 w=wp/170.0+st.w;
    float lobe=fbm(wp/620.0+st.w*0.37+vec2(0.0,uTime*0.004));
    float warp=fbm(w+vec2(uTime*0.012,0.0));
    float fing=noise(dir*s2.z+vec2(len*0.0022-uTime*0.008, st.w)); fing=max(fing*1.6+0.12,0.0); fing*=fing;
    float hair=noise(dir*s2.w+vec2(len*0.012, st.w*1.7));
    float d=d0+lobe*lobeAmp*min(sc,1.0)+warp*st.x*sc*1.6-fing*st.y*sc-max(hair,0.0)*st.z*sc*1.8+grain*1.5;
    float ph=ph4.x;
    d+=abs(noise(wp/40.0+st.w*1.3))*(8.0+30.0*ph)*sc;
    float comb=noise(dir*s2.w*1.7+vec2(len*0.006, st.w*3.1))*0.5+0.5;
    float fr=(1.0-smoothstep(0.0,fwMax,d))*step(0.0,d)*(0.12+0.75*comb*comb)*0.55*ph4.y;
    float t=-d;
    float band=(16.0+40.0*s2.y)*sc+5.0;
    float core=1.0-smoothstep(-1.2,1.2,d);
    float haze=(1.0-smoothstep(0.0,feather+1.0,d))*step(0.0,d)*0.16*(noise(w*7.0)*0.5+0.5);
    float mott=fbm(w*3.4+7.1)*0.9+0.5;
    float dens=mix(0.66+0.36*mott, 1.0, smoothstep(0.0,band,t));
    float a=clamp(max(core*dens,haze),0.0,1.0);
    vec3 deep=uCore[i].rgb, lit=uLight[i].rgb;
    vec3 ic=mix(lit*0.95, deep, smoothstep(0.0,band*1.8,t)*(0.42+0.58*mott));   // pigment: bright at the bleed, deep inside
    ic=mix(ic, lit*0.55, smoothstep(0.55,0.9,mott)*smoothstep(band*0.8,band*3.0,t)*0.35);   // pooled pigment inside
    float spk=step(0.997,hash1(floor(fc/2.5)+st.w))*smoothstep(0.0,band*0.35,t)*(1.0-smoothstep(band*0.6,band*1.5,t));
    ic=mix(ic, vec3(0.97), spk*0.8);
    float mt=uCore[i].a;
    if(mt>0.5 && o.w>0.001){
      float fh=uMRect[i].w;
      float pb=min(band, fh*0.1+4.0);
      float mv=(mt>2.5?smoothstep(pb*0.25, pb*1.4+min(18.0*sc, fh*0.08), t):smoothstep(band*0.4, band*2.2+30.0*sc, t))*o.w;
      vec3 mc;
      if(ph4.w==mkey){ mc=mcache; }
      else {
        vec4 mr=uMRect[i]; vec2 uv=(fc-mr.xy)/mr.zw; float rar=mr.z/max(mr.w,0.001);
        if(mt>2.5){ float car=4.0/3.0; vec2 s=uv-0.5; if(rar>car) s.y*=car/rar; else s.x*=rar/car; s=clamp(s+0.5,0.003,0.997);
          vec4 ar=uAtlas[i]; mc=texture2D(uPhoto, ar.xy+s*ar.zw).rgb; }
        else if(mt>1.5){ vec2 s=uv-0.5; if(rar>uTexAR.x) s.y*=uTexAR.x/rar; else s.x*=rar/uTexAR.x; mc=texture2D(uTex0,s+0.5).rgb; }
        else mc=fluid(uv*vec2(mr.z/mr.w,1.0), ph4.w, uPalA[i], uPalB[i], uLight[i].rgb);
        mkey=ph4.w; mcache=mc;
      }
      if(mt>2.5) mc=treatImg(mc, deep, lit, mott);
      ic=mix(ic, mc, mv);
    }
    vec3 fcol=mix(lit, vec3(1.0), 0.18);
    float fa=fr*(1.0-a);
    float inkOp=uFade[i];
    a*=inkOp;
    fa*=inkOp;
    vec4 layer=vec4(ic*a+fcol*fa, a+fa);
    acc=layer+acc*(1.0-layer.a);
  }
  if(uDrop.z>0.3){
    float dd=length(fc-uDrop.xy)-uDrop.z;
    for(int k=0;k<6;k++){ vec3 tr=uTrail[k]; if(tr.z>0.3) dd=smin(dd, length(fc-tr.xy)-tr.z, 10.0); }
    dd+=grain*0.9;
    float a=1.0-smoothstep(-1.0,1.0,dd);
    vec3 c=uDropInk;
    float hl=1.0-smoothstep(0.0, uDrop.z*0.34, length(fc-(uDrop.xy+vec2(-0.33,-0.38)*uDrop.z)));
    c=mix(c, vec3(1.0), hl*0.42);
    acc=vec4(c*a,a)+acc*(1.0-a);
  }
  gl_FragColor=acc;
}
`;
