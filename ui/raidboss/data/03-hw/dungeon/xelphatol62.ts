import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

// Xelphatol
const triggerSet: TriggerSet<Data> = {
  id: 'Xelphatol62',
  zoneId: ZoneId.Xelphatol62,
  timelineFile: 'xelphatol62.txt',
  timelineTriggers: [
    {
      id: 'Xelphatol62 Short Burst',
      regex: /Short Burst/,
      beforeSeconds: 4,
      suppressSeconds: 5, // Timelines jump sometimes, so let's not be noisy.
      response: Responses.tankBuster(),
    },
    {
      // This might be better handled by collecting Swiftfeather,
      // but a timeline trigger is easy and consistent.
      // This is *technically* avoidable, but if mishandled can kill melee or unwary healers.
      // (The timing from "cone locked in" to "cone damage snapshots" is 0.70 seconds.)
      id: 'Xelphatol62 On Low',
      regex: /On Low/,
      beforeSeconds: 5,
      response: Responses.tankCleave(),
    },
    {
      id: 'Xelphatol62 Ixali Aero Buster',
      regex: /Ixali Aero \(buster\)/,
      beforeSeconds: 4,
      response: Responses.tankBuster(),
    },
  ],
  triggers: [
    {
      id: 'Xelphatol62 Long Burst',
      type: 'StartsUsing',
      netRegex: { id: '19C8', source: 'Nuzal Hueloc', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Xelphatol62 Hot Blast',
      type: 'StartsUsing',
      netRegex: { id: '19CC', source: 'Floating Turret', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'Xelphatol62 On High',
      type: 'StartsUsing',
      netRegex: { id: '19CF', source: 'Dotoli Ciloc', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Xelphatol62 Dark Wings',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Puddle on YOU',
          de: 'Fläche auf DIR',
          fr: 'Zone au sol sur VOUS',
          ja: '自分に風',
          cn: '风圈点名',
          ko: '장판 대상자',
        },
      },
    },
    {
      id: 'Xelphatol62 Ixali Aero AOE',
      type: 'StartsUsing',
      netRegex: { id: '19D5', source: 'Tozol Huatotl', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Xelphatol62 Bill',
      type: 'HeadMarker',
      netRegex: { id: '0046' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Xelphatol62 Hawk',
      type: 'HeadMarker',
      netRegex: { id: '003E' },
      response: Responses.stackMarkerOn(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Abalathian Hornbill': 'abalathisch(?:e|er|es|en) Hornrabe',
        'Dotoli Ciloc': 'Dotoli Ciloc',
        'Garuda': 'Garuda',
        'Nuzal Hueloc': 'Nuzal Hueloc',
        'The Cage': 'Halbhöhle',
        'The Tlachtli': 'Tlachtli',
        'The Vortex': 'Ursprung des Windes',
        'Tozol Huatotl': 'Tozol Huatotl',
        'Floating Turret': 'Schwebend(?:e|er|es|en) Geschütz',
      },
      'replaceText': {
        '\\(buster\\)': '(Tankbuster)',
        '\\(line\\)': '(Line)',
        '\\(aoe\\)': '(AoE)',
        'Aerial Blast': 'Windschlag',
        'Air Raid': 'Luftangriff',
        'Bill': 'Schnabel',
        'Dark Wings': 'Dunkle Schwingen',
        'Eye Of The Storm': 'Auge des Sturms',
        'Ingurgitate': 'Fütterung',
        'Ixali Aero(?! I)': 'Ixal-Wind',
        'Ixali Aero II(?!I)': 'Ixal-Windra',
        'Ixali Aero III': 'Ixal-Windga',
        'Lift': 'Aufsteigen',
        'Long Burst': 'Aero-Schuss',
        'Mistral Song': 'Mistral-Song',
        'On High': 'Brausender Fächersturm',
        'On Low': 'Fächersturm',
        'Short Burst': 'Kurzer Knall',
        'Summon Garuda': 'Beschwörung Garudas',
        'Swiftfeather': 'Leichte Feder',
        'Wicked Wheel': 'Rad der Bosheit',
        'Wind Blast': 'Windknall',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Abalathian Hornbill': 'bucorve d\'Abalathia',
        'Dotoli Ciloc': 'Dotoli Ciloc',
        'Floating Turret': 'tourelle volante',
        'Garuda': 'Garuda',
        'Nuzal Hueloc': 'Nuzal Hueloc',
        'The Cage': 'Le Nichoir',
        'The Tlachtli': 'Tlachtli',
        'The Vortex': 'Source des rafales',
        'Tozol Huatotl': 'Tozol Huatotl',
      },
      'replaceText': {
        '\\(buster\\)': '(Tank buster)',
        '\\(line\\)': '(Ligne)',
        '\\(aoe\\)': '(AoE)',
        'Aerial Blast': 'Rafale aérienne',
        'Air Raid': 'Raid aérien',
        'Bill': 'Bec solide',
        'Dark Wings': 'Ailes sombres',
        'Eye Of The Storm': 'Œil du cyclone',
        'Ingurgitate': 'Nourrissage',
        'Ixali Aero(?! I)': 'Vent ixal',
        'Ixali Aero II(?!I)': 'Extra Vent ixal',
        'Ixali Aero III': 'Méga Vent ixal',
        'Lift': 'Montée',
        'Long Burst': 'Gros éclatement',
        'Mistral Song': 'Chant du mistral',
        'On High': 'Grand éventement',
        'On Low': 'Éventement',
        'Short Burst': 'Petit éclatement',
        'Summon Garuda': 'Invocation de Garuda',
        'Swiftfeather': 'Plume vive',
        'Wicked Wheel': 'Roue mauvaise',
        'Wind Blast': 'Coup de vent',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Abalathian Hornbill': 'アバラシア・ホーンビル',
        'Dotoli Ciloc': '旋風のドトリ・シロック',
        'Garuda': 'ガルーダ',
        'Nuzal Hueloc': '飛天のヌザル・フェロック',
        'The Cage': '営巣地門前',
        'The Tlachtli': 'タパソリ闘技場',
        'The Vortex': '神前祭壇',
        'Tozol Huatotl': '晴嵐のトゾル・ファトトル',
        'Floating Turret': 'バルーンタレット',
      },
      'replaceText': {
        '\\(buster\\)': '(タンクバスター)',
        '\\(line\\)': '(直線範囲)',
        '\\(aoe\\)': '(AoE)',
        'Aerial Blast': 'エリアルブラスト',
        'Air Raid': 'エアレイド',
        'Bill': 'ソリッドビル',
        'Dark Wings': '黒風',
        'Eye Of The Storm': 'アイ・オブ・ストーム',
        'Ingurgitate': '給餌',
        'Ixali Aero(?! I)': 'イクサリエアロ',
        'Ixali Aero II(?!I)': 'イクサリエアロラ',
        'Ixali Aero III': 'イクサリエアロガ',
        'Lift': '上昇',
        'Long Burst': 'エアロショット',
        'Mistral Song': 'ミストラルソング',
        'On High': '大扇風',
        'On Low': '扇風',
        'Short Burst': 'ショットバースト',
        'Summon Garuda': 'ガルーダ召喚',
        'Swiftfeather': 'スウィフトフェザー',
        'Wicked Wheel': 'ウィケッドホイール',
        'Wind Blast': 'ウィンドブラスト',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Abalathian Hornbill': '阿巴拉提亚犀鸟',
        'Dotoli Ciloc': '旋风扇 德托里·西罗克',
        'Garuda': '迦楼罗',
        'Nuzal Hueloc': '飞天枪 奴扎尔·怀罗克',
        'The Cage': '巢营门前',
        'The Tlachtli': '塔帕索利斗技场',
        'The Vortex': '风神祭坛',
        'Tozol Huatotl': '晴天霹雳 托佐尔·法托特尔',
        'Floating Turret': '气球炮塔',
      },
      'replaceText': {
        '\\(buster\\)': '(死刑)',
        '\\(line\\)': '(直线)',
        '\\(aoe\\)': '(AOE)',
        'Aerial Blast': '大气爆发',
        'Air Raid': '空袭',
        'Bill': '坚喙',
        'Dark Wings': '黑旋风',
        'Eye Of The Storm': '台风眼',
        'Ingurgitate': '掠食',
        'Ixali Aero(?! I)': '鸟人疾风',
        'Ixali Aero II(?!I)': '鸟人烈风',
        'Ixali Aero III': '鸟人暴风',
        'Lift': '上升',
        'Long Burst': '疾风射击',
        'Mistral Song': '寒风之歌',
        'On High': '大扇风',
        'On Low': '扇风',
        'Short Burst': '爆裂射击',
        'Summon Garuda': '召唤迦楼罗',
        'Swiftfeather': '身轻如燕',
        'Wicked Wheel': '邪轮旋风',
        'Wind Blast': '烈风爆射',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Abalathian Hornbill': '아발라시아 뿔부리',
        'Dotoli Ciloc': '선풍의 도톨리 실록',
        'Garuda': '가루다',
        'Nuzal Hueloc': '비천의 누잘 후엘록',
        'The Cage': '거주지 입구',
        'The Tlachtli': '타팍솔리 투기장',
        'The Vortex': '접신 제단',
        'Tozol Huatotl': '청풍의 토졸 후아토틀',
        'Floating Turret': '기구 포탑',
      },
      'replaceText': {
        'Aerial Blast': '대기 폭발',
        'Air Raid': '공습',
        'Bill': '단단한 부리',
        'Dark Wings': '흑풍',
        'Eye Of The Storm': '태풍의 눈',
        'Ingurgitate': '먹이 주기',
        'Ixali Aero(?! I)': '이크살 에어로',
        'Ixali Aero II(?!I)': '이크살 에어로라',
        'Ixali Aero III': '이크살 에어로가',
        'Lift': '상승',
        'Long Burst': '바람 사격',
        'Mistral Song': '삭풍의 노래',
        'On High': '대선풍',
        'On Low': '선풍',
        'Short Burst': '폭렬 사격',
        'Summon Garuda': '가루다 소환',
        'Swiftfeather': '깃털 바람',
        'Wicked Wheel': '마녀의 수레바퀴',
        'Wind Blast': '바람 분출',
      },
    },
  ],
};

export default triggerSet;