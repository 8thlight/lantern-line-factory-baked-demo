// The board's colours by name, as the Board artboard (design/screens/Board.dc.html) paints them.
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
  // the rest: the placement hover, text, and the end card's veil
  hover: 'rgba(255, 244, 201, 0.25)',
  hoverBad: 'rgba(230, 90, 90, 0.35)',
  text: '#f4efe1',
  dim: 'rgba(7, 19, 13, 0.7)', // #07130d at 0.7
});
