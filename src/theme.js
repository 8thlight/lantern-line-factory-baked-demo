// The board's colours by name, as the Board artboard (design/screens/Board.dc.html) paints them,
// and the HUD bar's, as the Main and HudStates artboards paint it.
// Every colour render.js draws with is one of these; an opacity the artboard sets is folded into rgba().

export const THEME = Object.freeze({
  // grass
  grassA: '#17311f',
  grassB: '#1a3623',
  grassBlade: '#2c5236',
  // path stones
  pathShadow: 'rgba(12, 26, 19, 0.45)', // #0c1a13 at 0.45
  pathEdge: '#8f6f40',
  pathStone: '#c9a66b',
  pathStoneDark: 'rgba(177, 141, 85, 0.55)', // #b18d55 at 0.55
  // lantern
  lanternPost: '#5a4326',
  lanternCap: '#4a3720',
  lanternPaper: '#e8a83a',
  lanternPaperLit: '#f6c95c',
  lanternCore: '#fff4c9',
  lanternRib: 'rgba(185, 122, 34, 0.45)', // #b97a22 at 0.45
  lanternTassel: '#d9534f',
  // lantern glow: the light pool on the grass
  glowInner: 'rgba(255, 210, 122, 0.42)', // #ffd27a at 0.42
  glowMid: 'rgba(242, 184, 78, 0.18)', // #f2b84e at 0.18
  glowOuter: 'rgba(242, 184, 78, 0)', // #f2b84e at 0
  // ghost
  ghostBody: 'rgba(155, 123, 230, 0.93)', // #9b7be6 at 0.93
  ghostEdge: '#4d3586',
  ghostSheen: 'rgba(217, 201, 255, 0.55)', // #d9c9ff at 0.55
  ghostEyes: '#1c1233',
  ghostEyeShine: '#f4efe1',
  // beam
  beam: '#fff4c9',
  beamGlow: '#ffe7a3',
  // health bar
  healthTrack: 'rgba(12, 26, 19, 0.7)', // #0c1a13 at 0.7
  healthHigh: '#7fd68a',
  healthMid: '#e9c75a',
  healthLow: '#e65a5a',
  // range ring on hover (design/screens.html:204)
  rangeRing: '#f2c14e',
  rangeFill: 'rgba(242, 193, 78, 0.07)', // #f2c14e at 0.07
  // the rest: the placement hover, text, and the end card's veil
  hover: 'rgba(255, 244, 201, 0.25)',
  hoverBad: 'rgba(230, 90, 90, 0.35)',
  text: '#f4efe1',
  dim: 'rgba(7, 19, 13, 0.7)', // #07130d at 0.7
  // HUD bar (design/screens/Main.dc.html, HudStates.dc.html)
  hudBg: 'rgba(10, 22, 16, 0.78)', // #0a1610 at 0.78
  hudLine: 'rgba(244, 239, 225, 0.08)', // #f4efe1 at 0.08
  hudPill: 'rgba(244, 239, 225, 0.06)', // #f4efe1 at 0.06
  hudInk: '#f4efe1',
  hudMuted: '#b8c4b0',
  hudAccent: '#f2c14e',
  hudOnAccent: '#12241c',
  hudCoinRim: '#b9861f',
  hudHeart: '#e65a5a',
  hudWave: '#c3a8ff',
  hudPipDim: 'rgba(195, 168, 255, 0.22)', // #c3a8ff at 0.22
  hudDangerPill: 'rgba(230, 90, 90, 0.16)', // #e65a5a at 0.16
  hudDangerRing: 'rgba(230, 90, 90, 0.6)', // #e65a5a at 0.6
  hudDangerHeart: '#ff7a7a',
  hudDangerValue: '#ff8f8f',
  hudDangerLabel: '#ffb3b3',
  hudButtonEdge: 'rgba(184, 196, 176, 0.45)', // #b8c4b0 at 0.45
  hudButtonBg: 'rgba(244, 239, 225, 0.04)', // #f4efe1 at 0.04
  hudButtonActive: 'rgba(244, 239, 225, 0.16)', // #f4efe1 at 0.16
  hudResumeBg: 'rgba(242, 193, 78, 0.14)', // #f2c14e at 0.14
});
