// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
// The first 1B marker in the encounter is an Hemitheos's Holy III stack marker (013E).
const firstHeadmarker = parseInt('013E', 16);
const getHeadmarkerId = (data, matches) => {
  // If we naively just check !data.decOffset and leave it, it breaks if the first marker is 013E.
  // (This makes the offset 0, and !0 is true.)
  if (typeof data.decOffset === 'undefined')
    data.decOffset = parseInt(matches.id, 16) - firstHeadmarker;
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  // Fortunately, we don't have to worry about whether or not this is robust,
  // since we know all the IDs that will be present in the encounter.
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};
// effect ids for inviolate purgation
const effectIdToOutputStringKey = {
  'CEE': 'spread',
  'D3F': 'spread',
  'D40': 'spread',
  'D41': 'spread',
  'CEF': 'stack',
  'D42': 'stack',
  'D43': 'stack',
  'D44': 'stack',
};
Options.Triggers.push({
  zoneId: ZoneId.AbyssosTheSeventhCircleSavage,
  timelineFile: 'p7s.txt',
  initData: () => ({
    purgationDebuffs: { 'dps': {}, 'support': {} },
    purgationDebuffCount: 0,
  }),
  triggers: [
    {
      id: 'P7S Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({}),
      condition: (data) => data.decOffset === undefined,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => {
        getHeadmarkerId(data, matches);
      },
    },
    {
      id: 'P7S Hemitheos\'s Holy III Healer Groups',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({}),
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        const correctedMatch = getHeadmarkerId(data, matches);
        if (correctedMatch === '013E')
          return output.healerGroups();
      },
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      id: 'P7S Condensed Aero II',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7836', source: 'Agdistis' }),
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'P7S Dispersed Aero II',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7835', source: 'Agdistis', capture: false }),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Split Tankbusters',
          de: 'Geteilter Tankbuster',
          ja: '2人同時タンク強攻撃',
          ko: '따로맞는 탱버',
        },
      },
    },
    {
      id: 'P7S Bough of Attis Left Arrows',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7824', source: 'Agdistis', capture: false }),
      response: Responses.goLeft(),
    },
    {
      id: 'P7S Bough of Attis Right Arrows',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7823', source: 'Agdistis', capture: false }),
      response: Responses.goRight(),
    },
    {
      id: 'P7S Hemitheos\'s Aero IV',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7A0B', source: 'Agdistis', capture: false }),
      response: Responses.knockback(),
    },
    {
      id: 'P7S Immature Stymphalide Tether',
      type: 'Tether',
      netRegex: NetRegexes.tether({ id: '0011', source: 'Immature Stymphalide', capture: false }),
      // ~9s between tether and Bronze Bellows (no cast) in all cases.
      delaySeconds: 4,
      // Just give this to everyone.  People in towers or elsewhere can be safe.
      suppressSeconds: 1,
      response: Responses.knockback(),
    },
    {
      id: 'P7S Spark of Life',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7839', source: 'Agdistis', capture: false }),
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'aoe + bleed',
          de: 'AoE + Blutung',
          ja: 'AOE + 出血',
          ko: '전체 공격 + 출혈',
        },
      },
    },
    {
      id: 'P7S Inviolate Bonds',
      type: 'GainsEffect',
      // CEC/D45 = Inviolate Winds
      // CED/D56 = Holy Bonds
      netRegex: NetRegexes.gainsEffect({ effectId: ['CEC', 'D45'] }),
      condition: Conditions.targetIsYou(),
      durationSeconds: 20,
      response: (_data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          stackThenSpread: Outputs.stackThenSpread,
          spreadThenStack: Outputs.spreadThenStack,
        };
        const longTimer = parseFloat(matches.duration) > 9;
        if (longTimer)
          return { infoText: output.stackThenSpread() };
        return { infoText: output.spreadThenStack() };
      },
    },
    {
      id: 'P7S Inviolate Purgation',
      type: 'GainsEffect',
      // CEE = Purgatory Winds I
      // D3F = Purgatory Winds II
      // D40 = Purgatory Winds III
      // D41 = Purgatory Winds IV
      // CEF = Holy Purgation I
      // D42 = Holy Purgation II
      // D43 = Holy Purgation III
      // D44 = Holy Purgation IV
      netRegex: NetRegexes.gainsEffect({ effectId: ['CE[EF]', 'D3F', 'D4[01234]'] }),
      preRun: (data, matches) => {
        data.purgationDebuffCount += 1;
        const role = data.party.isDPS(matches.target) ? 'dps' : 'support';
        const debuff = data.purgationDebuffs[role];
        if (!debuff)
          return;
        debuff[matches.effectId.toUpperCase()] = parseFloat(matches.duration);
      },
      durationSeconds: 55,
      infoText: (data, _matches, output) => {
        if (data.purgationDebuffCount !== 20)
          return;
        // Sort effects ascending by duration
        const role = data.role === 'dps' ? 'dps' : 'support';
        const unsortedDebuffs = Object.keys(data.purgationDebuffs[role] ?? {});
        const sortedDebuffs = unsortedDebuffs.sort((a, b) => (data.purgationDebuffs[role]?.[a] ?? 0) - (data.purgationDebuffs[role]?.[b] ?? 0));
        // get stack or spread from effectId
        const effects = sortedDebuffs.map((effectId) => effectIdToOutputStringKey[effectId]);
        const [effect1, effect2, effect3, effect4] = effects;
        if (!effect1 || !effect2 || !effect3 || !effect4)
          throw new UnreachableCode();
        return output.comboText({
          effect1: output[effect1](),
          effect2: output[effect2](),
          effect3: output[effect3](),
          effect4: output[effect4](),
        });
      },
      outputStrings: {
        comboText: {
          en: '${effect1} => ${effect2} => ${effect3} => ${effect4}',
          de: '${effect1} => ${effect2} => ${effect3} => ${effect4}',
          fr: '${effect1} => ${effect2} => ${effect3} => ${effect4}',
          ja: '${effect1} => ${effect2} => ${effect3} => ${effect4}',
          ko: '${effect1} => ${effect2} => ${effect3} => ${effect4}',
        },
        spread: Outputs.spread,
        stack: Outputs.stackMarker,
      },
    },
    {
      id: 'P7S Light of Life',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '78E2', source: 'Agdistis', capture: false }),
      // ~5s castTime, but boss cancels it and ability goes off 26s after start
      delaySeconds: 21,
      alertText: (_data, _matches, output) => output.bigAoEMiddle(),
      outputStrings: {
        bigAoEMiddle: {
          en: 'Big AOE, Get Middle',
          de: 'Große AoE, geh in die Mitte',
          fr: 'Grosse AoE, allez au milieu',
          ja: '強力なAOE、真ん中へ',
          cn: '超大伤害，去中间',
          ko: '아픈 광뎀, 중앙으로',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Condensed Aero II/Dispersed Aero II': 'Condensed/Dispersed Aero II',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Agdistis': 'Agdistis',
        'Immature Io': 'unreif(?:e|er|es|en) Io',
        'Immature Minotaur': 'unreif(?:e|er|es|en) Minotaurus',
        'Immature Stymphalide': 'unreif(?:e|er|es|en) Stymphalides',
      },
      'replaceText': {
        '--chasing aoe--': '--verfolgende AoEs--',
        '--eggs--': '--Eier--',
        'arrow': 'Pfeil',
        'close': 'Nahe',
        'far': 'Entfernt',
        'Blades of Attis': 'Schwertblatt des Attis',
        'Bough of Attis': 'Ast des Attis',
        'Bronze Bellows': 'Böenschlag',
        'Bullish Slash': 'Bullenansturm',
        'Bullish Swipe': 'Bullenfeger',
        'Condensed Aero II': 'Gehäuftes Windra',
        'Death\'s Harvest': 'Unheilvolle Wucherung des Lebens',
        'Dispersed Aero II': 'Flächiges Windra',
        'Famine\'s Harvest': 'Wilde Wucherung des Lebens',
        'Forbidden Fruit': 'Frucht des Lebens',
        'Hemitheos\'s Aero III': 'Hemitheisches Windga',
        'Hemitheos\'s Aero IV': 'Hemitheisches Windka',
        'Hemitheos\'s Glare(?! III)': 'Hemitheische Blendung',
        'Hemitheos\'s Glare III': 'Hemitheisches Blendga',
        'Hemitheos\'s Holy(?! III)': 'Hemitheisches Sanctus',
        'Hemitheos\'s Holy III': 'Hemitheisches Sanctga',
        'Hemitheos\'s Tornado': 'Hemitheischer Tornado',
        'Immortal\'s Obol': 'Zweig des Lebens und des Todes',
        'Inviolate Bonds': 'Siegelschaffung',
        'Inviolate Purgation': 'Siegelschaffung der Hölle',
        'Light of Life': 'Aurora des Lebens',
        'Multicast': 'Multizauber',
        'Roots of Attis': 'Wurzel des Attis',
        'Shadow of Attis': 'Lichttropfen des Attis',
        'Spark of Life': 'Schein des Lebens',
        'Static Path': 'Statischer Pfad',
        'Stymphalian Strike': 'Vogelschlag',
        'War\'s Harvest': 'Chaotische Wucherung des Lebens',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Agdistis': 'Agdistis',
        'Immature Io': 'io immature',
        'Immature Minotaur': 'minotaure immature',
        'Immature Stymphalide': 'stymphalide immature',
      },
      'replaceText': {
        'Blades of Attis': 'Lames d\'Attis',
        'Bough of Attis': 'Grandes branches d\'Attis',
        'Bronze Bellows': 'Frappe rafale',
        'Bullish Slash': 'Taillade catabatique',
        'Bullish Swipe': 'Balayage catabatique',
        'Condensed Aero II': 'Extra Vent concentré',
        'Death\'s Harvest': 'Bourgeonnement de vie morbide',
        'Dispersed Aero II': 'Extra vent étendu',
        'Famine\'s Harvest': 'Bourgeonnement de vie féroce',
        'Forbidden Fruit': 'Fruits de la vie',
        'Hemitheos\'s Aero III': 'Méga Vent d\'hémithéos',
        'Hemitheos\'s Aero IV': 'Giga Vent d\'hémithéos',
        'Hemitheos\'s Glare(?! III)': 'Chatoiement d\'hémithéos',
        'Hemitheos\'s Glare III': 'Méga Chatoiement d\'hémithéos',
        'Hemitheos\'s Holy(?! III)': 'Miracle d\'hémithéos',
        'Hemitheos\'s Holy III': 'Méga Miracle d\'hémithéos',
        'Hemitheos\'s Tornado': 'Tornade d\'hémithéos',
        'Immortal\'s Obol': 'Branche de vie et de mort',
        'Inviolate Bonds': 'Tracé de sigil',
        'Inviolate Purgation': 'Tracé de sigils multiples',
        'Light of Life': 'Éclair de vie',
        'Multicast': 'Multisort',
        'Roots of Attis': 'Racines d\'Attis',
        'Shadow of Attis': 'Rai d\'Attis',
        'Spark of Life': 'Étincelle de vie',
        'Static Path': 'Chemin statique',
        'Stymphalian Strike': 'Assaut stymphalide',
        'War\'s Harvest': 'Bourgeonnement de vie chaotique',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Agdistis': 'アグディスティス',
        'Immature Io': 'イマチュア・イーオー',
        'Immature Minotaur': 'イマチュア・タウロス',
        'Immature Stymphalide': 'イマチュア・ステュムパリデス',
      },
      'replaceText': {
        'Blades of Attis': 'アッティスの刃葉',
        'Bough of Attis': 'アッティスの巨枝',
        'Bronze Bellows': 'ガストストライク',
        'Bullish Slash': 'ブルスラッシュ',
        'Bullish Swipe': 'ブルスワイプ',
        'Condensed Aero II': 'アグリゲート・エアロラ',
        'Death\'s Harvest': '生命の繁茂【凶】',
        'Dispersed Aero II': 'スプレッド・エアロラ',
        'Famine\'s Harvest': '生命の繁茂【猛】',
        'Forbidden Fruit': '生命の果実',
        'Hemitheos\'s Aero III': 'ヘーミテオス・エアロガ',
        'Hemitheos\'s Aero IV': 'ヘーミテオス・エアロジャ',
        'Hemitheos\'s Glare(?! III)': 'ヘーミテオス・グレア',
        'Hemitheos\'s Glare III': 'ヘーミテオス・グレアガ',
        'Hemitheos\'s Holy(?! III)': 'ヘーミテオス・ホーリー',
        'Hemitheos\'s Holy III': 'ヘーミテオス・ホーリガ',
        'Hemitheos\'s Tornado': 'ヘーミテオス・トルネド',
        'Immortal\'s Obol': '生滅の導枝',
        'Inviolate Bonds': '魔印創成',
        'Inviolate Purgation': '魔印創成・獄',
        'Light of Life': '生命の極光',
        'Multicast': 'マルチキャスト',
        'Roots of Attis': 'アッティスの根',
        'Shadow of Attis': 'アッティスの光雫',
        'Spark of Life': '生命の光芒',
        'Static Path': 'スタティックパース',
        'Stymphalian Strike': 'バードストライク',
        'War\'s Harvest': '生命の繁茂【乱】',
      },
    },
  ],
});