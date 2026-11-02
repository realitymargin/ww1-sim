// sim.mjs for the browser (built by tools/build_page_w1.mjs): the Node file import is removed, `export` dropped, and the command-line study runs only under Node. The model itself is unchanged.
// RealityMargin · "I Simulated WW1 … Times" — the war model. Version 3 (31 Oct 2026). v2 kept as sim_v2.mjs.
// One war = August 1914 onward, in half-year turns, through the real turning points of 1914–1918 in their real order.
// At each one the dice decide: does it go the way it really went, or the other way? Every probability is a judgement,
// written down with its reason and sources in INPUTS.md. Three columns: [against the Central Powers, historians' middle (headline), for them].
//
// What carries the war between the turning points is real data, not invented strengths (the WW2 sim's viewers: "a spinwheel, not data"):
//   each power's war effort each year = its 1913 GDP × its wartime GDP index × the share of GDP its government spent × its army's effectiveness
//   (Broadberry & Harrison, The Economics of World War I, 2005, Tables 1, 2, 4, 5; effectiveness from the war's own death toll, Urlanis 1971).
//   The U-boat war runs on the official monthly tonnage lost (Fayle, Seaborne Trade III, 1924, Table I(a)); the 1918 Spring Offensive on the
//   divisions on the Western Front (192 German, about 180 British and French).
// Each half-year both sides lose will in proportion to the effort they face; the blockade drains the Central Powers on top.
// Calibrated in sim_test.mjs: real history must end in the Central Powers' collapse in the second half of 1918.
// Outcomes: CENTRAL POWERS WIN (the Western Allies forced to terms) · ALLIED WIN (the Central Powers collapse)
//           · COMPROMISE PEACE (a negotiated peace, no winner) · STILL FIGHTING 1920.
// Every fork goes through roll(name, p): it always draws one random number (overrides never shift the stream), and an
// override map H can pin any fork (forced experiments, tests). Usage: node sim.mjs → results_v3.json + RESULTS_v3.md   Tests: node sim_test.mjs
// (the Node file import is removed in the browser copy)

// [against the Central Powers, middle, for the Central Powers] — the chance that the event happens
const ODDS = {
  // 1914
  eastFirst:     [0.02, 0.05, 0.10],  // Germany keeps the East-first plan: attack Russia, defend in the west, Belgium left alone
  ukOut:         [0.02, 0.05, 0.10],  // Britain stays out in August 1914 although Belgium is invaded
  ukOutNoBelgium:[0.35, 0.50, 0.65],  //   …Britain stays out at first when Belgium is NOT invaded
  ukJoinsLater:  [0.20, 0.15, 0.10],  //   …per half-year: a neutral Britain comes in later
  ruEastPrussia: [0.35, 0.25, 0.15],  // Russia wins in East Prussia in August 1914 (no Tannenberg)
  marne:         [0.05, 0.10, 0.18],  // Germany wins the Marne in September 1914
  franceOut14:   [0.25, 0.40, 0.55],  //   …and France makes peace before the end of 1914
  restMakePeace: [0.60, 0.75, 0.85],  // France knocked out: Britain and Russia make peace within the year
  ypres:         [0.05, 0.10, 0.15],  // Germany takes the Channel ports (Calais, Boulogne) in the autumn of 1914
  ottomanIn:     [0.55, 0.70, 0.85],  // the Ottoman Empire joins the Central Powers (November 1914)
  italyCP:       [0.01, 0.03, 0.06],  // Italy honours the Triple Alliance and joins the Central Powers
  italyEntente:  [0.85, 0.75, 0.65],  //   …otherwise: Italy joins the Allies (May 1915)
  // 1915
  gallipoli:     [0.25, 0.15, 0.08],  // the Allies force the Dardanelles: Constantinople falls, the Ottomans are out
  ruPeace15:     [0.02, 0.05, 0.10],  // after the Great Retreat, Russia makes a separate peace in 1915
  bulgariaIn:    [0.55, 0.70, 0.80],  // Bulgaria joins the Central Powers (October 1915), Serbia overrun
  // 1916
  verdun:        [0.02, 0.05, 0.09],  // Verdun breaks the French army
  jutland:       [0.02, 0.04, 0.08],  // the High Seas Fleet wins decisively at Jutland and the blockade loosens
  brusilov:      [0.12, 0.07, 0.03],  // the Brusilov offensive knocks Austria-Hungary out of the war
  romaniaIn:     [0.80, 0.70, 0.60],  // Romania joins the Allies (August 1916)
  peace1916:     [0.02, 0.05, 0.08],  // December 1916: Germany's peace note and Wilson's call for terms lead to a negotiated peace
  // 1917
  usw:           [0.85, 0.80, 0.70],  // Germany resumes unrestricted submarine warfare (February 1917)
  convoyLate:    [0.10, 0.20, 0.35],  //   …and the Admiralty resists convoys until 1918 (they became general in August 1917)
  ukFloor:       [22000, 25000, 27000], //   …the imports Britain cannot go below, thousand tons a year (1917: 34,000 imported, 26,000 of it food, munitions and ore; Fayle III), drawn ±10%
  restAfterUK:   [0.65, 0.80, 0.90],  // Britain driven to terms by the U-boats: France makes peace too
  telegram:      [0.95, 0.90, 0.80],  // Zimmermann sends the telegram to Mexico (January 1917)
  usEnters:      [0.95, 0.92, 0.85],  // the US declares war in April 1917 after the U-boats and the telegram
  usEntersNoTel: [0.85, 0.75, 0.60],  //   …after the U-boats, with no telegram
  usEntersLate:  [0.40, 0.25, 0.12],  //   …with no unrestricted U-boat war: the US still enters, a year later
  sixtus:        [0.07, 0.04, 0.02],  // Austria-Hungary makes a separate peace (the Sixtus affair, 1917)
  frMutiny:      [0.02, 0.05, 0.10],  // the French army mutinies of May 1917 become a collapse
  ruRevolution:  [0.80, 0.88, 0.95],  // the February Revolution: the Tsar falls (March 1917)
  lenin:         [0.80, 0.90, 0.95],  //   …Germany sends Lenin home through Germany in a sealed train (April 1917)
  ruExitLenin:   [0.75, 0.85, 0.92],  //   …Russia leaves the war (Bolshevik coup, Brest-Litovsk), with Lenin back
  ruExitNoLenin: [0.25, 0.40, 0.55],  //   …Russia leaves the war anyway, without Lenin
  ruExitNoRev:   [0.05, 0.10, 0.15],  //   …Russia leaves the war with the Tsar still in power
  caporetto:     [0.05, 0.10, 0.20],  // Caporetto knocks Italy out of the war (October 1917)
  peace1917:     [0.02, 0.04, 0.07],  // August 1917: the Pope's peace note and the Reichstag peace resolution lead to a negotiated peace
  // 1918
  eastKept:      [0.95, 0.85, 0.70],  // Germany keeps about 50 divisions (a million men) in the East in 1918 to hold Ukraine and the Baltic
  michael:       [0.06, 0.12, 0.20],  // the Spring Offensive splits the British from the French (at the real balance of divisions)
  splitTerms:    [0.35, 0.50, 0.65],  //   …and the split Allies seek terms
  // the endgame, per half-year
  compromise:    [0.10, 0.20, 0.30],  // both sides near exhaustion: a negotiated peace
};
const SET = { against: 0, mid: 1, for: 2 };

// ---- the data (INPUTS.md has every source) ----
const YEARS = [1914, 1915, 1916, 1917, 1918];
const DATA = {
  // 1913 GDP, billion international dollars of 1990 (Broadberry & Harrison 2005, Tables 1 and 2)
  gdp: { uk: 226.4, fr: 138.7, ru: 257.7, it: 91.3, us: 511.6, ro: 11.7, ser: 7.2, ger: 244.3, ah: 100.5, ot: 25.3, bul: 7.4 },
  // real GDP, % of 1913, 1914–1918 (Table 4; Italy "kept going and did not collapse": 100; Ottoman Empire down 30–40% by 1918: ramp; small states flat 90)
  idx: { uk: [92.3, 94.9, 108.0, 105.3, 114.8], us: [101.0, 109.1, 111.5, 112.5, 113.2], ger: [85.2, 80.9, 81.7, 81.8, 81.8],
    ah: [83.5, 77.4, 76.5, 74.8, 73.3], ru: [94.5, 95.5, 79.8, 67.7, 67.7], fr: [92.9, 91.0, 95.6, 81.0, 63.9], it: [100, 100, 100, 100, 100],
    ot: [95, 90, 80, 70, 65], bul: [90, 90, 90, 90, 90], ro: [90, 90, 90, 90, 90], ser: [90, 90, 90, 90, 90] },
  // government spending, % of GDP (Table 5). Russia and Italy: France's series; Austria-Hungary: Germany's × 0.85; small powers and the Ottomans: 30
  gov: { uk: [23.5, 52.4, 63.7, 61.3, 49.4], fr: [22.3, 46.4, 47.2, 49.9, 53.5], ger: [23.9, 43.8, 50.3, 59.0, 50.1], us: [16.6, 16.6, 16.6, 16.6, 16.6] },
  // fighting effectiveness per unit of effort (judgement anchored on the war's deaths: the Allies lost 5.4 million soldiers, the Central Powers 4.0 million, Urlanis 1971)
  eff: { ger: 1.3, ah: 0.8, ot: 0.9, bul: 0.9, uk: 1.0, fr: 1.0, ru: 0.6, it: 0.7, us: 0.85, ro: 0.5, ser: 0.8 },
  // Americans who had sailed for France, as a share of the 2,084,000 who reached it, by months after the declaration (6 April 1917):
  // 194,000 by the end of 1917, 1,000,000 by 1 July 1918, the second million by the end of October (Ayres, The War with Germany: A Statistical Summary, 1919)
  aef: [[0, 0], [3, 0.01], [9, 0.093], [12, 0.16], [15, 0.48], [19, 0.96], [20, 1]],
  ukLand: 0.7,                                      // the share of Britain's war effort that faced the Central Powers on land (the rest: the Navy, the Empire's garrisons)
  // the U-boat war: world tonnage lost through enemy action, Feb–Dec 1917, thousand gross tons (Fayle 1924, Table I(a))
  sunk1917: [540, 594, 881, 597, 688, 558, 512, 352, 459, 289, 399],
  sunk1918: [307, 319, 343, 279, 296, 256, 261, 284, 188, 119, 18, 0],   // Jan–Dec 1918, same table (the war ends in November)
  // Britain's ocean-going fleet (steamers of 1,600 gross tons and up) at the end of each month, thousand gross tons (Fayle III, Table V(a))
  ukFleet1917: [16591, 16464, 16291, 15874, 15664, 15412, 15209, 15060, 14975, 14827, 14755, 14580],
  ukFleet1918: [14547, 14414, 14425, 14482, 14448, 14413, 14417, 14346, 14363, 14407, 14444, 14626],
};
const CP = ['ger', 'ah', 'ot', 'bul'], ALLIES = ['uk', 'fr', 'ru', 'it', 'us', 'ro', 'ser'];
const series = (k, p) => DATA[k][p] || (k === 'gov' ? (p === 'ru' || p === 'it' ? DATA.gov.fr : p === 'ah' ? DATA.gov.ger.map(v => v * 0.85) : [30, 30, 30, 30, 30]) : null);
const yi = y => Math.max(0, Math.min(4, Math.floor(y) - 1914));
// one power's war effort in a half-year (before damage from the forks)
// the average of the American arrival curve between two month marks
function aefShare(m0, m1) { const A = DATA.aef, at = m => { if (m <= 0) return 0; for (let i = 1; i < A.length; i++) if (m <= A[i][0]) return A[i - 1][1] + (A[i][1] - A[i - 1][1]) * (m - A[i - 1][0]) / (A[i][0] - A[i - 1][0]); return 1; };
  let s = 0; for (let k = 0; k < 12; k++) s += at(m0 + (m1 - m0) * (k + 0.5) / 12); return s / 12; }
const effort = (p, y) => DATA.gdp[p] * series('idx', p)[yi(y)] / 100 * series('gov', p)[yi(y)] / 100 * DATA.eff[p] * (p === 'uk' ? DATA.ukLand : 1);

const MECH = {
  wear: 0.055,                    // will lost per half-year per unit of the effort ratio facing each side (calibrated)
  hunger: 0.016, hungerCap: 0.06, // the blockade: extra Central Powers will lost per half-year, growing each half-year Britain holds the sea (calibrated)
  michaelCost: 0.12,              // a failed 1918 offensive: about 900,000 German casualties by July
  usShock: 0.05,                  // the US declares war: the Central Powers know time is now against them
  noDollars: 0.06,                // from mid-1917, without the US at war, Allied will lost per half-year to the dollar shortage (Burk 1985)
  otTieUk: 0.85, otTieRu: 0.9,   // the share of Britain's and Russia's land effort left for Germany and Austria while the Ottomans fight (judgement)
  compromiseBelow: 0.35,          // both sides' will under this: a negotiated peace becomes possible
  preConvoy: 643, convoyFrom: 6, // the U-boats: average Feb–Jul 1917 loss; convoys general from August (6 months after Feb)
  uGrow: 0.02, uCap: 800,        // without convoys, monthly sinkings grow 2% a month as more U-boats come into service, up to 800,000 tons (judgement)
  fleetShare: 0.5, add1917: 84, add1918: 115, // fitted to Table V(a): about half of each month's world loss came off Britain's ocean-going fleet; new ships and requisitions added 84 / 115 thousand tons a month
  convoyRate: 270,               // average monthly world loss Jan–Oct 1918, with convoys (Fayle Table I(a))
  importsPerTon: 2.2,            // a year's imports per gross ton of ocean-going fleet (1917: 34 million tons imported on about 15.4 million tons of ships)
  gerWest: 150, eastTransfer: 42, eastExtra: 30, ahOutCost: 15, frDiv: 100, ukDiv: 60, usDivMar18: 4, michaelEven: 0.95, michaelSpan: 0.22, michaelUs: 0.75, splitUs: 0.4,
};

// "the Central Powers' way" for each fork, used by the forced experiments
const CP_WAY = { eastKept: false, eastFirst: true, ukOut: true, ruEastPrussia: false, marne: true, franceOut14: true, ypres: true, ottomanIn: true, italyCP: true,
  gallipoli: false, ruPeace15: true, bulgariaIn: true, verdun: true, jutland: true, brusilov: false, romaniaIn: false, usw: false, convoyLate: true,
  uboats: true, telegram: false, usEnters: false, sixtus: false, frMutiny: true, ruRevolution: true, lenin: true, ruExit: true, caporetto: true, michael: true, splitTerms: true };
// what really happened, used by the calibration tests
const REAL = { eastKept: true, eastFirst: false, ukOut: false, ruEastPrussia: false, marne: false, ypres: false, ottomanIn: true, italyCP: false, italyEntente: true,
  gallipoli: false, ruPeace15: false, bulgariaIn: true, verdun: false, jutland: false, brusilov: false, romaniaIn: true, peace1916: false, usw: true, convoyLate: false,
  uboats: false, telegram: true, usEnters: true, sixtus: false, frMutiny: false, ruRevolution: true, lenin: true, ruExit: true, caporetto: false, peace1917: false, michael: false };

const warSeed = (seed, i) => (Math.imul(seed ^ 0x9E3779B9, 0x85EBCA6B) + Math.imul(i + 1, 0xC2B2AE35)) >>> 0;
function rng(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// one war. P = odds for this set; H = overrides {fork: true/false}
function war(P, R, H = {}) {
  const roll = (k, p) => { const r = R(); return k in H ? !!H[k] : r < p; };
  const path = [], M = MECH;
  const at = { uk: 'war', fr: 'war', ru: 'war', it: 'neutral', us: 'neutral', ro: 'neutral', ser: 'war', ger: 'war', ah: 'war', ot: 'neutral', bul: 'neutral' };
  const mod = Object.fromEntries([...CP, ...ALLIES].map(p => [p, 1]));
  const S = { cpWill: 1, enWill: 1, blockade: 0, usFrom: 0 };
  const end = (outcome, why, y) => ({ outcome, why, y, path, cpWin: outcome === 'CENTRAL POWERS WIN', S });
  const cpWin = (why, y) => end('CENTRAL POWERS WIN', why, y), alWin = (why, y) => end('ALLIED WIN', why, y), draw = (why, y) => end('COMPROMISE PEACE', why, y);

  // ---- 1914 ----
  if (roll('eastFirst', P.eastFirst)) { S.plan = 'east'; path.push('Germany attacks Russia first'); }
  if (roll('ukOut', S.plan === 'east' ? P.ukOutNoBelgium : P.ukOut)) { at.uk = 'neutral'; path.push('Britain stays out'); }
  if (S.plan === 'east') { mod.fr *= 0.9; mod.ru *= 0.85; } // France bleeds attacking into Lorraine (Plan XVII); Russia faces most of the German army
  if (roll('ruEastPrussia', P.ruEastPrussia)) { mod.ger *= 0.95; mod.ru *= 1.05; path.push('Russia wins in East Prussia'); }
  // the Marne: harder with Britain's six divisions in the line, easier without them; impossible under the East-first plan
  const marneP = S.plan === 'east' ? 0 : Math.min(0.9, P.marne * (at.uk === 'war' ? 1 : 1.6));
  if (roll('marne', marneP)) { path.push('Germany wins the Marne');
    if (roll('franceOut14', P.franceOut14)) { path.push('France makes peace 1914');
      if (at.uk !== 'war' || roll('restMakePeace', P.restMakePeace)) return cpWin('France knocked out in 1914; the rest make peace', 1915.0);
      at.fr = 'out'; S.enWill -= 0.25; }
    else { R(); mod.fr *= 0.85; S.enWill -= 0.1; } // the north and Paris's suburbs lost, the government in Bordeaux
  } else { R(); R(); }
  if (roll('ypres', P.ypres) && at.uk === 'war' && S.plan !== 'east') { S.ports = true; mod.uk *= 0.95; path.push('Germany takes the Channel ports'); }
  if (roll('ottomanIn', P.ottomanIn)) { at.ot = 'war'; path.push('Ottomans join'); }
  else { S.straits = true; mod.ru *= 1.1; } // the Straits stay open: Russia keeps its Black Sea trade and Allied supplies (review v3: was missing)
  if (roll('italyCP', P.italyCP)) { at.it = 'cp'; path.push('Italy joins the Central Powers'); }
  else if (!roll('italyEntente', P.italyEntente)) path.push('Italy stays neutral'); else S.italyJoins = true;

  for (let y = 1915.0; y < 1920; y += 0.5) {
    // ---- the turning points, in real order ----
    if (y === 1915.0) {
      if (roll('gallipoli', P.gallipoli) && at.ot === 'war') { at.ot = 'out'; mod.ru *= 1.1; S.straits = true; path.push('Allies take the Dardanelles'); }
      if (roll('ruPeace15', P.ruPeace15 * (S.plan === 'east' ? 3 : 1) * (S.straits ? 0.5 : 1)) && at.ru === 'war') { at.ru = 'out'; path.push('Russia makes peace 1915'); }
    }
    if (y === 1915.5) {
      if (S.italyJoins) { at.it = 'war'; path.push('Italy joins the Allies'); }
      if (roll('bulgariaIn', P.bulgariaIn * (at.ot === 'war' ? 1 : 0.3))) { at.bul = 'war'; at.ser = 'out'; path.push('Bulgaria joins'); }
    }
    if (y === 1916.0) {
      if (roll('verdun', P.verdun) && at.fr === 'war') { mod.fr *= 0.7; S.enWill -= 0.2; path.push('Verdun breaks the French army'); }
      if (roll('jutland', P.jutland) && at.uk === 'war') { S.jutland = true; S.enWill -= 0.05; path.push('Germany wins at Jutland'); }
    }
    if (y === 1916.5) {
      if (roll('brusilov', P.brusilov) && at.ru === 'war') { at.ah = 'out'; S.cpWill -= 0.2; path.push('Brusilov knocks out Austria-Hungary'); }
      if (roll('romaniaIn', P.romaniaIn) && at.ah === 'war') { at.ro = 'war'; path.push('Romania joins the Allies'); }
    }
    if (y === 1917.0) {
      if (roll('peace1916', P.peace1916)) { path.push('Peace of 1917'); return draw('the peace notes of December 1916 lead to a negotiated peace', 1917.0); }
      // the U-boat gamble
      const usw = roll('usw', P.usw) && at.uk === 'war';
      if (usw) { path.push('Unrestricted U-boat war');
        const late = roll('convoyLate', P.convoyLate); if (late) path.push('No convoys in 1917');
        const luck = 0.85 + 0.3 * R(), floor = P.ukFloor * (0.9 + 0.2 * R());
        // Britain's fleet, month by month from February 1917: half of each month's world loss comes off it, new ships go on it
        let F = DATA.ukFleet1917[0], m = 0, uRate = M.preConvoy; S.fleet = [F];
        for (; m < 35; m++) { const real = m < 11 ? DATA.sunk1917[m] : m < 23 ? DATA.sunk1918[m - 11] : 0;
          let sunk = real; if (late && m >= M.convoyFrom) { uRate = Math.min(M.uCap, uRate * (1 + M.uGrow)); sunk = Math.max(real, uRate); }
          if (m >= 22 && !late) sunk = M.convoyRate; // after the real war's end, a war still going: the 1918 convoy-era average
          sunk *= luck * (S.ports ? 1.15 : 1);
          F += -M.fleetShare * sunk + (m < 11 ? M.add1917 : M.add1918); S.fleet.push(Math.round(F));
          if (F * M.importsPerTon < floor) break; }
        S.ukFloorTons = Math.round(floor);
        const breaks = 'uboats' in H ? H.uboats : m < 35;
        if (breaks) S.ukBreakT = 'uboats' in H ? 1917.75 : 1917 + (2 + m) / 12; // the month imports fall below the floor
      } else { for (let k = 0; k < 3; k++) R(); }
      const tel = roll('telegram', P.telegram); if (tel) S.telegram = true;
      if (usw) { if (roll('usEnters', tel ? P.usEnters : P.usEntersNoTel)) { at.us = 'war'; S.usFrom = 1917.25; S.cpWill -= M.usShock; path.push('US enters 1917'); } else path.push('US stays out'); }
      else if (roll('usEnters', P.usEntersLate)) { at.us = 'war'; S.usFrom = 1918.25; S.cpWill -= M.usShock; path.push('US enters 1918'); } else path.push('US stays out');
      if (roll('sixtus', P.sixtus) && at.ah === 'war') { at.ah = 'out'; S.cpWill -= 0.15; path.push('Austria-Hungary makes a separate peace'); }
      if (roll('frMutiny', P.frMutiny) && at.fr === 'war') { path.push('French army collapses 1917');
        if (at.uk !== 'war' || roll('restMakePeace', P.restMakePeace * (at.us === 'war' ? 0.4 : 1))) return cpWin('the French army collapses in 1917; the Allies make peace', 1917.5);
        at.fr = 'out'; S.enWill -= 0.25; }
      else R();
      // Russia, 1917: the Tsar, Lenin, the exit
      const revP = P.ruRevolution * (S.straits ? 0.7 : 1) * (at.ah === 'out' ? 0.6 : 1);
      if (roll('ruRevolution', revP) && at.ru === 'war') { S.revolution = true; path.push('Tsar falls');
        if (roll('lenin', P.lenin)) { S.lenin = true; path.push('Lenin sent home'); } }
      else R();
    }
    if (y === 1917.5) {
      const exitP = S.revolution ? (S.lenin ? P.ruExitLenin : P.ruExitNoLenin) : P.ruExitNoRev;
      if (roll('ruExit', exitP) && at.ru === 'war') { at.ru = 'out'; S.grain = true; S.cpWill += 0.1; path.push('Russia leaves the war'); }
      if (roll('caporetto', P.caporetto) && at.it === 'war') { at.it = 'out'; path.push('Caporetto knocks Italy out'); }
      if (roll('peace1917', P.peace1917)) { path.push('Peace of 1917'); return draw('the peace notes of 1917 lead to a negotiated peace', 1918.0); }
    }
    if (y === 1918.0) {
      // the Spring Offensive, on the divisions in the west
      const kept = roll('eastKept', P.eastKept); if (!kept && at.ru !== 'war') path.push('The East emptied for the west');
      const gerDiv = M.gerWest + (at.ru !== 'war' ? M.eastTransfer + (kept ? 0 : M.eastExtra) : 0) - (at.ah !== 'war' ? M.ahOutCost : 0);
      const alDiv = (at.fr === 'war' ? M.frDiv * mod.fr : 0) + (at.uk === 'war' ? M.ukDiv * mod.uk : 0) + (at.us === 'war' && S.usFrom < 1918 ? M.usDivMar18 : 0);
      S.divRatio = gerDiv / Math.max(1, alDiv);
      const usIn = at.us === 'war';
      // with the Americans in, French divisions came out of quiet sectors and the US held the Marne in June 1918; nobody seeks terms with 10,000 Americans landing a day
      const mP = P.michael * Math.max(0, Math.min(2.5, (S.divRatio - M.michaelEven) / M.michaelSpan)) * (usIn ? M.michaelUs : 1);
      if (roll('michael', Math.min(0.9, mP))) { path.push('Spring Offensive splits the Allies');
        if (roll('splitTerms', P.splitTerms * (usIn ? M.splitUs : 1))) return cpWin('the 1918 Spring Offensive splits the Allies and they seek terms', 1918.5);
        S.enWill -= 0.2; S.cpWill -= M.michaelCost / 2; }
      else { R(); if (at.ru !== 'war') { S.cpWill -= M.michaelCost; mod.ger *= 0.9; } }
    }
    // the U-boats: Britain's imports fall below the floor in this half-year
    // within a half-year, a collapse of will is taken to come about two months before its end (real history: November 1918), so a break in the last two months waits for the next half-year
    if (S.ukBreakT !== undefined && S.ukBreakT <= y + 0.33 && at.uk === 'war' && !S.ukBroken) { S.ukBroken = true; path.push('U-boats force Britain to terms');
      if (at.fr === 'war' && roll('restAfterUK', P.restAfterUK * (at.us === 'war' && y >= 1918 ? 0.5 : 1))) return cpWin('the U-boats force Britain to terms, and France follows', y + 0.5);
      at.uk = 'out'; S.blockade = 0; S.enWill -= 0.25; }
    else R();
    if (at.uk === 'neutral') { if (roll('ukJoinsLater', P.ukJoinsLater)) { at.uk = 'war'; path.push('Britain enters ' + Math.floor(y)); } } else R();

    // ---- the war of resources ----
    const cpE = CP.reduce((s, p) => s + (at[p] === 'war' ? effort(p, y) * mod[p] : 0), 0) + (at.it === 'cp' ? effort('it', y) : 0);
    const usW = at.us === 'war' ? aefShare((y - S.usFrom) * 12, (y + 0.5 - S.usFrom) * 12) : 0; // the half-year's average share of the army in France
    // the Ottoman fronts (Gallipoli, Mesopotamia, Palestine, the Caucasus) tie down British and Russian armies: about 500,000 British Empire troops by 1918
    const otTie = p => at.ot === 'war' ? (p === 'uk' ? M.otTieUk : p === 'ru' ? M.otTieRu : 1) : 1;
    const ruNoRev = p => p === 'ru' && y >= 1917 && !S.revolution ? DATA.idx.ru[2] / DATA.idx.ru[yi(y)] : 1; // Russia's 1917 collapse in output came with the revolution; without it, its 1916 level
    const enE = ALLIES.reduce((s, p) => s + (at[p] === 'war' ? effort(p, y) * mod[p] * (p === 'us' ? usW : 1) * otTie(p) * ruNoRev(p) : 0), 0);
    if (enE <= 1) return cpWin('no Allied power left in the field', y + 0.5);
    const ratio = enE / cpE;
    if (at.uk === 'war') S.blockade = Math.min(M.hungerCap, S.blockade + M.hunger * (S.jutland ? 0.5 : 1));
    S.cpWill -= M.wear * ratio + S.blockade * (S.grain ? 0.8 : 1);
    S.enWill -= M.wear / ratio + (y >= 1917.5 && at.us !== 'war' && at.uk === 'war' ? M.noDollars : 0);
    if (H.__trace) H.__trace.push({ y, enE: +enE.toFixed(1), cpE: +cpE.toFixed(1), ratio: +ratio.toFixed(2), cpWill: +S.cpWill.toFixed(2), enWill: +S.enWill.toFixed(2), blockade: +S.blockade.toFixed(3) });
    if (S.cpWill <= 0) return alWin('the Central Powers collapse', y + 0.5);
    if (S.enWill <= 0) return cpWin('the Allies are worn out and seek terms', y + 0.5);
    if (roll('compromise', S.cpWill < M.compromiseBelow && S.enWill < M.compromiseBelow ? P.compromise : 0)) { path.push('Compromise peace'); return draw('both sides exhausted: a negotiated peace', y + 0.5); }
  }
  return end('STILL FIGHTING 1920', 'no side able to finish the war by 1920', 1920);
}

const oddsFor = set => { const P = {}; for (const k in ODDS) P[k] = ODDS[k][SET[set]]; return P; };
const ROUTINE = /^(Ottomans join|Bulgaria joins|Italy joins the Allies|Romania joins the Allies|Unrestricted U-boat war|US enters 1917|Tsar falls|Lenin sent home|Russia leaves the war)$/;
function batch(set, n, seed, H) { const P = oddsFor(set); const out = { n, cpWins: 0, outcomes: {}, why: {}, paths: {}, endYear: {} };
  for (let i = 0; i < n; i++) { const r = war(P, rng(warSeed(seed, i)), H); out.outcomes[r.outcome] = (out.outcomes[r.outcome] || 0) + 1; out.why[r.why] = (out.why[r.why] || 0) + 1;
    const ey = String(Math.floor(r.y - 0.01)); out.endYear[ey] = (out.endYear[ey] || 0) + 1;
    if (r.cpWin) { out.cpWins++; const key = r.path.filter(p => !ROUTINE.test(p)).join(' → ') || '(as in history until the end)'; out.paths[key] = (out.paths[key] || 0) + 1; } }
  return out; }

const FORCED = Object.keys(CP_WAY);
if (typeof process !== 'undefined' && process.argv && process.argv[1] && /[\\/]sim\.mjs$/.test(process.argv[1])) { // run the full study only when called directly
  const N = +(process.argv[2] || 500000);
  const res = { date: new Date().toISOString(), version: 3, main: batch('mid', N, 19140728), sets: { against: batch('against', 100000, 1), for: batch('for', 100000, 2) }, forced: {} };
  res.against = {};
  for (const f of FORCED) { res.forced[f] = batch('mid', 100000, 1918, { [f]: CP_WAY[f] }); res.against[f] = batch('mid', 100000, 1918, { [f]: !CP_WAY[f] }); }
  res.forcedBase = batch('mid', 100000, 1918);
  // how much the headline leans on the judgements that are not data
  const sens = (label, f) => { const keep = JSON.stringify({ M: MECH, D: DATA.eff }); f(); const b = batch('mid', 100000, 1919); const k = JSON.parse(keep); Object.assign(MECH, k.M); Object.assign(DATA.eff, k.D); return [label, b.cpWins]; };
  res.assumptions = [
    sens('German army effectiveness 1.15 instead of 1.3', () => { DATA.eff.ger = 1.15; }),
    sens('German army effectiveness 1.45 instead of 1.3', () => { DATA.eff.ger = 1.45; }),
    sens('Russian army effectiveness 0.8 instead of 0.6', () => { DATA.eff.ru = 0.8; }),
  ];
  fs.writeFileSync(new URL('./results_v3.json', 'file:///'), JSON.stringify(res, null, 1));
  const pct = (a, n) => (100 * a / n).toFixed(2) + '%'; const m = res.main;
  let md = `# Simulation results, model v3 (${res.date.slice(0, 10)})\n\nHeadline: **${m.n.toLocaleString()} wars** on the historians' middle odds → **the Central Powers won ${m.cpWins.toLocaleString()} times (${pct(m.cpWins, m.n)})**.\n\n## Outcomes\n`;
  for (const [k, v] of Object.entries(m.outcomes).sort((a, b) => b[1] - a[1])) md += `- ${k}: ${v.toLocaleString()} (${pct(v, m.n)})\n`;
  md += `\n## How the war ended\n`; for (const [k, v] of Object.entries(m.why).sort((a, b) => b[1] - a[1])) md += `- ${k}: ${v.toLocaleString()} (${pct(v, m.n)})\n`;
  md += `\n## The year the war ended\n`; for (const [k, v] of Object.entries(m.endYear).sort()) md += `- ${k}: ${v.toLocaleString()} (${pct(v, m.n)})\n`;
  md += `\n## The winning paths (top 12)\n`; for (const [k, v] of Object.entries(m.paths).sort((a, b) => b[1] - a[1]).slice(0, 12)) md += `- ${v.toLocaleString()} (${pct(v, m.cpWins)} of wins): ${k}\n`;
  md += `\n## Sensitivity (100,000 wars each)\n- Odds against the Central Powers: ${pct(res.sets.against.cpWins, 1e5)}\n- Odds for the Central Powers: ${pct(res.sets.for.cpWins, 1e5)}\n`;
  md += `\n## One fork forced the Central Powers' way (100,000 wars each; same-size baseline ${pct(res.forcedBase.cpWins, 1e5)})\n`; for (const [k, v] of Object.entries(res.forced).sort((a, b) => b[1].cpWins - a[1].cpWins)) md += `- ${k}: ${pct(v.cpWins, v.n)}\n`;
  md += `
## The judgements that are not data (100,000 wars each, middle odds)
`; for (const [k, v] of res.assumptions) md += `- ${k}: ${pct(v, 1e5)}
`;
  md += `
## One fork forced the Allies' way (100,000 wars each)
`; for (const [k, v] of Object.entries(res.against).sort((a, b) => a[1].cpWins - b[1].cpWins)) md += `- ${k}: ${pct(v.cpWins, v.n)}
`;
  fs.writeFileSync(new URL('./RESULTS_v3.md', 'file:///'), md); console.log(md);
}
