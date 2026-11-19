// Every colour the board is drawn with, as named tokens read off the Claude Design
// artboards (design/screens/Board, Win and Lose). Alpha lives in the token, so
// render.js never builds a colour string of its own.

export const THEME = {
  // grass
  grassA: '#17311f',
  grassB: '#1a3623',
  grassBlade: '#2c5236',
  // path stones
  pathShadow: 'rgba(12, 26, 19, 0.45)',
  pathEdge: '#8f6f40',
  pathStone: '#c9a66b',
  pathJoint: 'rgba(177, 141, 85, 0.55)',
  // lantern paper
  lanternPaper: '#e8a83a',
  lanternInner: '#f6c95c',
  lanternCore: '#fff4c9',
  lanternRib: 'rgba(185, 122, 34, 0.45)',
  lanternCap: '#4a3720',
  lanternPost: '#5a4326',
  lanternTassel: '#d9534f',
  // lantern glow
  glowCentre: 'rgba(255, 210, 122, 0.42)',
  glowMid: 'rgba(242, 184, 78, 0.18)',
  glowEdge: 'rgba(242, 184, 78, 0)',
  // ghost body
  ghostBody: 'rgba(155, 123, 230, 0.93)',
  ghostEdge: '#4d3586',
  ghostSheen: 'rgba(217, 201, 255, 0.55)',
  // ghost eyes
  ghostEye: '#1c1233',
  ghostEyeShine: '#f4efe1',
  // beam
  beam: '#fff4c9',
  beamGlow: '#ffe7a3',
  beamSoft: 'rgba(255, 231, 163, 0.35)',
  // health bar
  healthTrack: 'rgba(12, 26, 19, 0.7)',
  healthHigh: '#7fd68a',
  healthMid: '#e9c75a',
  healthLow: '#e65a5a',
  // placement hover
  hover: 'rgba(255, 244, 201, 0.25)',
  hoverBad: 'rgba(230, 90, 90, 0.35)',
  // text
  text: '#f4efe1',
  textMuted: '#b8c4b0',
  // end-of-round cards
  dim: 'rgba(7, 19, 13, 0.6)',
  cardWin: 'rgba(10, 22, 16, 0.9)',
  cardWinEdge: 'rgba(242, 193, 78, 0.5)',
  cardWinTitle: '#f2c14e',
  cardLose: 'rgba(16, 10, 20, 0.9)',
  cardLoseEdge: 'rgba(195, 168, 255, 0.45)',
  cardLoseTitle: '#c3a8ff',
};
