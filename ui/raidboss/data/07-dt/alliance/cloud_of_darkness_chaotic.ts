import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: tweak trigger durations/delays
// TODO: Break IV safe look-away direction?
// TODO: Surecast/Arm's Length call for Break IV/Aero IV during Blade of Darkness?
// TODO: tile refresh reminders?
// TODO: Active-pivot Particle Beam - call move/stay based on player position?

type ThirdArtOfDarknessId = keyof typeof thirdArtOfDarknessHeadmarker;
type ThirdArtOfDarkness = 'leftCleave' | 'rightCleave' | 'pairStacks' | 'proteanSpread';

const thirdArtOfDarknessHeadmarker = {
  '00EF': 'leftCleave',
  '00F0': 'rightCleave',
  '00F1': 'pairStacks',
  '00F2': 'proteanSpread',
} as const;

const isThirdArtOfDarknessId = (id: string): id is ThirdArtOfDarknessId => {
  return id in thirdArtOfDarknessHeadmarker;
};

const center = {
  'x': 100,
  'y': 100,
} as const;

const headMarkerData = {
  // player about to be tethered
  // Vfx Path: m0005sp_09o0t
  'tetherMarker': '000C',
  // stack marker on healers
  // Offsets: 83994
  // Vfx Path: com_share2i
  'healerStack': '0064',
  // chasing AoE marker
  // Vfx Path: tracking_lockon01i
  'chasingAoe': '00C5',
  // Stygian Shadow telegraph
  // Offsets: 220975
  // Vfx Path: m0684_charge_c0x
  'leftCleave': '00EF',
  // Stygian Shadow telegraph
  // Offsets: 220975
  // Vfx Path: m0684_charge_c1x
  'rightCleave': '00F0',
  // Stygian Shadow telegraph
  // Vfx Path: m0684_charge_c2x
  'pairStacks': '00F1',
  // Stygian Shadow telegraph
  // Vfx Path: m0684_charge_c3x
  'proteanSpread': '00F2',
  // tankbuster with circular cleave
  // Vfx Path: tank_lockonae_4m_5s_01t
  'tankCleave': '0156',
  // flare marker
  // Offsets: 76147,157739
  // Vfx Path: all_at8s_0v
  'flareMarker': '015A',
  // player who will drop a bramble
  // Vfx Path: m0302_seed_8s_x
  'evilSeed': '0227',
  // countdown to hand spawning on player
  // Offsets: 86301,97364,104403,111399,145339,153274,165355
  // Vfx Path: l1rz_grasp_count5s_0x
  'handCountdown': '0228',
  // clockwise rotation
  // Vfx Path: turnright_14m_14s_c0x
  'rotateClockwise': '0234',
  // counter-clockwise rotation
  // Vfx Path: turnleft_14m_14s_c0x
  'rotateCounterClockwise': '0235',
  // bramble about to tether to a player
  // Vfx Path: exclamation_8s_x
  'exclamationMarker': '0239',
} as const;

export interface Data extends RaidbossData {
  deadlyEmbraceDodgeDirectionCollected: 'front' | 'back' | 'unknown';
  deadlyEmbraceDodgeDirection: 'front' | 'back' | 'unknown';
  bladeOfDarknessFollowup?: 'death' | 'aero';
  innerDarkness?: boolean;
  outerDarkness?: boolean;
  mySide?: 'east' | 'west';
  thirdArtOfDarkness: {
    east?: ThirdArtOfDarkness[];
    west?: ThirdArtOfDarkness[];
  };
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheCloudOfDarknessChaotic',
  zoneId: ZoneId.TheCloudOfDarknessChaotic,
  timelineFile: 'cloud_of_darkness_chaotic.txt',
  initData: () => ({
    deadlyEmbraceDodgeDirectionCollected: 'unknown',
    deadlyEmbraceDodgeDirection: 'unknown',
    thirdArtOfDarkness: {},
  }),
  triggers: [
    {
      id: 'Cloud Chaotic Doom',
      type: 'GainsEffect',
      netRegex: { effectId: 'D24', capture: true },
      condition: (data, matches) => {
        // this can get very noisy if we trigger on every player that receives Doom,
        // so limit to only calling for players in your immediate party.
        return data.CanCleanse() && data.party.inParty(matches.target);
      },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => {
        return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Cleanse Doom',
        },
      },
    },
    {
      id: 'Cloud Chaotic Lightning Resistance Down Swap',
      type: 'GainsEffect',
      netRegex: { effectId: '1122', capture: true },
      condition: (data, matches) => {
        const stackCount = parseInt(matches.count);
        return stackCount >= 5 && data.role === 'tank' && data.party.inParty(matches.target);
      },
      alertText: (_data, _matches, output) => {
        return output.tankSwap!();
      },
      outputStrings: {
        tankSwap: Outputs.tankSwap,
      },
    },
    {
      id: 'Cloud Chaotic Blade of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9DFD', '9DFB', '9DFF'], source: 'Cloud of Darkness', capture: true },
      durationSeconds: (data) => data.bladeOfDarknessFollowup !== undefined ? 7 : 3,
      suppressSeconds: 2,
      infoText: (data, matches, output) => {
        const mech = matches.id === '9DFD' ? 'left' : (matches.id === '9DFB' ? 'right' : 'out');
        const mechOutput = output[mech]!();
        const followup = data.bladeOfDarknessFollowup;
        if (followup === undefined)
          return mechOutput;

        delete data.bladeOfDarknessFollowup;

        return output.combo!({
          mech: mechOutput,
          followup: output[followup]!(),
        });
      },
      outputStrings: {
        combo: {
          en: '${mech} => ${followup}',
        },
        left: {
          en: 'Left, under hand',
        },
        right: {
          en: 'Right, under hand',
        },
        aero: {
          en: 'Knockback',
        },
        death: Outputs.outThenIn,
        out: Outputs.out,
      },
    },
    {
      id: 'Cloud Chaotic Deluge of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9E3D', '9E01'], source: 'Cloud of Darkness', capture: false },
      response: Responses.bleedAoe('alert'),
    },
    {
      id: 'Cloud Chaotic Grim Embrace Collector',
      type: 'StartsUsing',
      netRegex: { id: ['9E39', '9E3A'], source: 'Cloud of Darkness', capture: true },
      run: (data, matches) => {
        data.deadlyEmbraceDodgeDirectionCollected = matches.id === '9E39' ? 'back' : 'front';
      },
    },
    {
      id: 'Cloud Chaotic Deadly Embrace',
      type: 'GainsEffect',
      netRegex: { effectId: '1055', capture: true },
      condition: Conditions.targetIsYou(),
      preRun: (data) =>
        data.deadlyEmbraceDodgeDirection = data.deadlyEmbraceDodgeDirectionCollected,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 7,
      durationSeconds: 7,
      infoText: (data, _matches, output) => output[data.deadlyEmbraceDodgeDirection]!(),
      outputStrings: {
        back: {
          en: 'Bait hand, dodge backwards',
        },
        front: {
          en: 'Bait hand, dodge forwards',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Cloud Chaotic Rapid-sequence Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: '9E40', source: 'Cloud of Darkness', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Wild Charge (alliances)',
        },
      },
    },
    {
      id: 'Cloud Chaotic Unholy Darkness',
      type: 'StartsUsing',
      netRegex: { id: 'A12D', source: 'Cloud of Darkness', capture: false },
      infoText: (_data, _matches, output) => output.healerGroups!(),
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      id: 'Cloud Chaotic Flare Marker',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.flareMarker, capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.flare!(),
      outputStrings: {
        flare: {
          en: 'Flare on you',
        },
      },
    },
    {
      id: 'Cloud Chaotic Break IV',
      type: 'StartsUsing',
      // 9E4F = dummy cast from boss (ends slightly before actual cast)
      // 9E50 = actual cast from boss (sometimes has stale source name)
      // 9E51 = dummy cast from adds (source: Sinister Eye)
      // 9E52 = actual cast from adds (sometimes has stale source name)
      netRegex: { id: '9E4F', source: 'Cloud of Darkness', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'Cloud Chaotic Endeath IV Collector',
      type: 'StartsUsing',
      netRegex: { id: '9E53', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.bladeOfDarknessFollowup = 'death',
    },
    {
      id: 'Cloud Chaotic Enaero IV Collector',
      type: 'StartsUsing',
      netRegex: { id: '9E54', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.bladeOfDarknessFollowup = 'aero',
    },
    {
      id: 'Cloud Chaotic Death IV',
      type: 'StartsUsing',
      netRegex: { id: '9E43', source: 'Cloud of Darkness', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Far away => in',
        },
      },
    },
    {
      id: 'Cloud Chaotic Aero IV',
      type: 'StartsUsing',
      netRegex: { id: '9E4C', source: 'Cloud of Darkness', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Cloud Chaotic Flood of Darkness Raidwide',
      type: 'StartsUsing',
      netRegex: { id: ['9E3E', '9E07'], source: 'Cloud of Darkness', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Cloud Chaotic Inner/Outer Darkness Gain',
      type: 'GainsEffect',
      netRegex: { effectId: ['1051', '1052'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        switch (matches.effectId) {
          case '1051':
            data.innerDarkness = true;
            break;
          case '1052':
            data.outerDarkness = true;
            break;
        }
      },
    },
    {
      id: 'Cloud Chaotic Inner/Outer Darkness Lose',
      type: 'LosesEffect',
      netRegex: { effectId: ['1051', '1052'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        switch (matches.effectId) {
          case '1051':
            delete data.innerDarkness;
            break;
          case '1052':
            delete data.outerDarkness;
            break;
        }
      },
    },
    {
      id: 'Cloud Chaotic Dark Dominion',
      type: 'StartsUsing',
      netRegex: { id: '9E08', source: 'Cloud of Darkness', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Cloud Chaotic Side Collector',
      type: 'Ability',
      // 9E08 = Dark Dominion (from boss), occurs before The Third Art of Darkness add mechanics
      // 9E2E = unknown (from both adds), occurs before Lateral-core/Core-lateral add mechanics
      netRegex: { id: ['9E08', '9E2E'], capture: false },
      suppressSeconds: 1,
      promise: async (data) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
        })).combatants;

        const me = actors.find((actor) => actor.Name === data.me);

        if (!me) {
          console.error(`Cloud Chaotic Side Collector: can't find player ${data.me}`);
        } else {
          data.mySide = me.PosX < center.x ? 'east' : 'west';
        }
      },
    },
    {
      id: 'Cloud Chaotic Atomos Spawn',
      type: 'AddedCombatant',
      // 13626 = Atomos
      netRegex: { npcNameId: '13626', capture: false },
      suppressSeconds: 1,
      response: Responses.killAdds(),
    },
    {
      id: 'Cloud Chaotic Particle Concentration',
      type: 'Ability',
      netRegex: { id: '9E18', source: 'Cloud Of Darkness', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Towers',
          de: 'Türme nehmen',
          fr: 'Prenez les tours',
          ja: '塔を踏む',
          cn: '踩塔',
          ko: '기둥 들어가기',
        },
      },
    },
    {
      id: 'Cloud Chaotic Ghastly Gloom',
      type: 'StartsUsing',
      netRegex: { id: ['9E09', '9E0B'], source: 'Cloud of Darkness', capture: true },
      alertText: (_data, matches, output) => {
        switch (matches.id) {
          case '9E09':
            return output.corners!();
          case '9E0B':
            return output.under!();
        }
      },
      outputStrings: {
        corners: {
          en: 'Corners',
        },
        under: Outputs.getUnder,
      },
    },
    {
      id: 'Cloud Chaotic Flood of Darkness Interrupt',
      type: 'StartsUsing',
      netRegex: { id: '9E37', source: 'Stygian Shadow', capture: true },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < center.x ? 'east' : 'west';
        return data.outerDarkness && side === data.mySide;
      },
      response: Responses.interruptIfPossible(),
    },
    {
      id: 'Cloud Chaotic Chaos-condensed Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: '9E0D', source: 'Cloud of Darkness', capture: false },
      // this is a Wild Charge, tanks should be in front
      response: Responses.stackMarker(),
    },
    {
      id: 'Cloud Chaotic Diffusive-force Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: '9E10', source: 'Cloud of Darkness', capture: false },
      response: Responses.spread(),
    },
    {
      id: 'Cloud Chaotic Active-pivot Particle Beam',
      type: 'StartsUsing',
      // 9E13 = clockwise, 9E15 = counterclockwise
      netRegex: { id: ['9E13', '9E15'], source: 'Cloud of Darkness', capture: true },
      infoText: (_data, matches, output) => {
        const rotateStr = matches.id === '9E13' ? output.clockwise!() : output.counterClockwise!();
        return output.rotate!({ rotateStr: rotateStr });
      },
      outputStrings: {
        rotate: {
          en: 'Rotate ${rotateStr}',
        },
        clockwise: Outputs.clockwise,
        counterClockwise: Outputs.counterclockwise,
      },
    },
    {
      id: 'Cloud Chaotic Curse Of Darkness AoE',
      type: 'StartsUsing',
      netRegex: { id: '9E33', source: 'Stygian Shadow', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Cloud Chaotic Curse Of Darkness Face Laser',
      type: 'GainsEffect',
      netRegex: { effectId: '953', capture: true },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Face Laser Out',
          de: 'Laser nach draußen richten',
          fr: 'Orientez le laser vers l\'extérieur',
          ja: 'レーザーを外に向ける',
          cn: '向外引导激光',
          ko: '바깥 바라보기 (레이저 유도)',
        },
      },
    },
    {
      id: 'Cloud Chaotic Excruciate',
      type: 'StartsUsing',
      netRegex: { id: '9E36', source: 'Stygian Shadow', capture: true },
      // TODO: some strats may prefer to have this call for any party members
      // being targeted by the buster regardless of inside/outside position
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < center.x ? 'east' : 'west';
        return data.me === matches.target || (data.outerDarkness && side === data.mySide);
      },
      response: Responses.tankCleave(),
    },
    {
      id: 'Cloud Chaotic Lateral-core Phaser',
      type: 'StartsUsing',
      netRegex: { id: '9E2F', source: 'Stygian Shadow', capture: true },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < center.x ? 'east' : 'west';
        return data.outerDarkness && side === data.mySide;
      },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Sides => middle',
        },
      },
    },
    {
      id: 'Cloud Chaotic Core-lateral Phaser',
      type: 'StartsUsing',
      netRegex: { id: '9E30', source: 'Stygian Shadow', capture: true },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < center.x ? 'east' : 'west';
        return data.outerDarkness && side === data.mySide;
      },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Middle => sides',
        },
      },
    },
    {
      id: 'Cloud Chaotic Evil Seed',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.evilSeed, capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Place Bramble',
          de: 'Dornenstrauch plazieren',
          fr: 'Placez les ronces',
          ja: '苗木を捨てる',
          cn: '击退放置荆棘',
          ko: '장판 유도하기',
        },
      },
    },
    {
      id: 'Cloud Chaotic Thorny Vine',
      type: 'GainsEffect',
      netRegex: { effectId: '1BD', capture: true },
      condition: Conditions.targetIsYou(),
      response: Responses.breakChains(),
    },
    {
      id: 'Cloud Chaotic The Third Art of Darkness Collector',
      type: 'HeadMarker',
      netRegex: {
        id: Object.keys(thirdArtOfDarknessHeadmarker),
        target: 'Stygian Shadow',
        capture: true,
      },
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
        })).combatants;

        const actorID = parseInt(matches.targetId, 16);
        const actor = actors.find((actor) => actor.ID === actorID);

        if (!actor) {
          console.error(
            `Cloud Chaotic The Third Art of Darkness Collector: can't find actor ${actorID}`,
          );
          return;
        }

        if (!isThirdArtOfDarknessId(matches.id)) {
          throw new UnreachableCode();
        }

        const side = actor.PosX < center.x ? 'east' : 'west';
        const mech = thirdArtOfDarknessHeadmarker[matches.id];

        if (side === 'east') {
          (data.thirdArtOfDarkness.east ??= []).push(mech);
        } else {
          (data.thirdArtOfDarkness.west ??= []).push(mech);
        }
      },
    },
    {
      id: 'Cloud Chaotic The Third Art of Darkness Initial',
      type: 'StartsUsing',
      netRegex: { id: ['9E20', '9E23'], source: 'Stygian Shadow', capture: true },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < center.x ? 'east' : 'west';
        return data.outerDarkness && side === data.mySide;
      },
      // delay enough to capture the first mechanic telegraph
      delaySeconds: 2,
      infoText: (data, matches, output) => {
        const side = parseFloat(matches.x) < center.x ? 'east' : 'west';
        const shadowData = side === 'east'
          ? data.thirdArtOfDarkness.east
          : data.thirdArtOfDarkness.west;

        if (!shadowData) {
          console.error(
            `Cloud Chaotic The Third Art of Darkness Initial: missing shadowData for side ${side}`,
          );
        }

        const [mech1] = shadowData ?? [];

        return output.text!({
          first: mech1 === undefined ? output.unknown!() : output[mech1]!(),
        });
      },
      outputStrings: {
        text: {
          en: 'Start ${first}',
        },
        leftCleave: Outputs.right,
        rightCleave: Outputs.left,
        pairStacks: Outputs.stacks,
        proteanSpread: Outputs.protean,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Cloud Chaotic The Third Art of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9E20', '9E23'], source: 'Stygian Shadow', capture: true },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < center.x ? 'east' : 'west';
        return data.outerDarkness && side === data.mySide;
      },
      // the adds take a long time to telegraph all of their upcoming mechanics
      delaySeconds: 7.5,
      alertText: (data, matches, output) => {
        const side = parseFloat(matches.x) < center.x ? 'east' : 'west';
        const shadowData = side === 'east'
          ? data.thirdArtOfDarkness.east
          : data.thirdArtOfDarkness.west;

        if (!shadowData) {
          console.error(
            `Cloud Chaotic The Third Art of Darkness: missing shadowData for side ${side}`,
          );
        }

        const [mech1, mech2, mech3] = shadowData ?? [];

        return output.text!({
          first: mech1 === undefined ? output.unknown!() : output[mech1]!(),
          second: mech2 === undefined ? output.unknown!() : output[mech2]!(),
          third: mech3 === undefined ? output.unknown!() : output[mech3]!(),
        });
      },
      outputStrings: {
        text: {
          en: '${first} => ${second} => ${third}',
          de: '${first} => ${second} => ${third}',
          fr: '${first} => ${second} => ${third}',
          ja: '${first} => ${second} => ${third}',
          cn: '${first} => ${second} => ${third}',
          ko: '${first} => ${second} => ${third}',
        },
        leftCleave: Outputs.right,
        rightCleave: Outputs.left,
        pairStacks: Outputs.stacks,
        proteanSpread: Outputs.protean,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Cloud Chaotic The Third Art of Darkness Cleanup',
      type: 'Ability',
      netRegex: { id: ['9E20', '9E23'], source: 'Stygian Shadow', capture: false },
      suppressSeconds: 1,
      run: (data) => {
        delete data.thirdArtOfDarkness.east;
        delete data.thirdArtOfDarkness.west;
      },
    },
    {
      id: 'Cloud Chaotic Looming Chaos',
      type: 'StartsUsing',
      netRegex: { id: 'A2CB', source: 'Cloud of Darkness', capture: false },
      preRun: (data) => delete data.mySide,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'AoE + player swaps',
        },
      },
    },
    {
      id: 'Cloud Chaotic Looming Chaos Enmity Reset',
      type: 'Ability',
      netRegex: { id: 'A2CB', source: 'Cloud of Darkness', capture: false },
      condition: (data) => data.role === 'tank',
      delaySeconds: 3,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Provoke Boss',
          de: 'Boss abspotten',
          fr: 'Provoquez le Boss',
          ja: '挑発',
          cn: '挑衅',
          ko: '보스 도발',
        },
      },
    },
    {
      id: 'Cloud Chaotic Feint Particle Beam',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.chasingAoe, capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Chasing AoE on YOU',
          de: 'Verfolgende AoE auf DIR',
          fr: 'Ruée sur VOUS',
          ja: '追跡AOE',
          cn: '追踪AOE点名',
          ko: '연속장판 대상자',
        },
      },
    },
  ],
  timelineReplace: [],
};

export default triggerSet;
