import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO:
// Wind phase triggers for chain break and knockback direction
// Earth phase triggers
// More ice phase triggers
// Phase two triggers

export interface Data extends RaidbossData {
  absoluteAuthorityDebuff: 'stack' | 'spread';
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheMinstrelsBalladSphenesBurden',
  zoneId: ZoneId.TheMinstrelsBalladSphenesBurden,
  timelineFile: 'queen-eternal-ex.txt',
  initData: () => ({
    absoluteAuthorityDebuff: 'stack',
  }),
  triggers: [
    {
      id: 'QueenEternal Ex Virtual Shift',
      type: 'StartsUsing',
      netRegex: { id: ['A019', 'A01A', 'A01B'], source: 'エターナルクイーン', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'QueenEternal Ex Aeroquell',
      type: 'StartsUsing',
      netRegex: { id: 'A025', source: 'エターナルクイーン', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.stacks!(),
      outputStrings: {
        stacks: Outputs.healerGroups,
      },
    },
    {
      id: 'QueenEternal Ex Legitimate Force East Safe First',
      type: 'StartsUsing',
      netRegex: { id: 'A01E', source: 'エターナルクイーン', capture: false },
      response: Responses.goRightThenLeft(),
    },
    {
      id: 'QueenEternal Ex Legitimate Force West Safe First',
      type: 'StartsUsing',
      netRegex: { id: 'A020', source: 'エターナルクイーン', capture: false },
      response: Responses.goLeftThenRight(),
    },
    {
      id: 'QueenEternal Ex World Shatter',
      type: 'StartsUsing',
      netRegex: { id: 'A01C', source: 'エターナルクイーン', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'QueenEternal Ex Divide and Conquer',
      type: 'StartsUsing',
      netRegex: { id: 'A017', source: 'エターナルクイーン', capture: false },
      response: Responses.spread(),
    },
    {
      id: 'QueenEternal Ex Prosecution of War',
      type: 'StartsUsing',
      netRegex: { id: 'A00A', source: 'エターナルクイーン', capture: true },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'QueenEternal Ex Royal Domain',
      type: 'StartsUsing',
      netRegex: { id: 'A04E', source: 'エターナルクイーン', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'QueenEternal Ex Weighty Blow',
      type: 'StartsUsing',
      netRegex: { id: 'A033', source: 'エターナルクイーン', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Hide behind rocks',
        },
      },
    },
    {
      id: 'QueenEternal Ex Coronation',
      type: 'StartsUsing',
      netRegex: { id: 'A013', source: 'エターナルクイーン', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread, aim lasers',
        },
      },
    },
    {
      id: 'QueenEternal Ex Absolute Authority',
      type: 'StartsUsing',
      netRegex: { id: 'A041', source: 'エターナルクイーン', capture: false },
      infoText: (_data, _matches, output) => output.bait!(),
      outputStrings: {
        bait: Outputs.baitPuddles,
      },
    },
    {
      id: 'QueenEternal Ex Absolute Authority Debuff Collector',
      type: 'GainsEffect',
      netRegex: { effectId: '105A', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.absoluteAuthorityDebuff = 'spread',
    },
    {
      id: 'QueenEternal Ex Absolute Authority Debuff Mechanics',
      type: 'GainsEffect',
      netRegex: { effectId: '105A', capture: false },
      delaySeconds: 1,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        return output.combo!({
          stackSpread: output[data.absoluteAuthorityDebuff]!(),
          dorito: output.dorito!(),
        });
      },
      outputStrings: {
        spread: {
          en: 'Flare Marker Spread',
        },
        stack: Outputs.stackMarker,
        dorito: Outputs.doritoStack,
        combo: {
          en: '${stackSpread} => ${dorito}',
          de: '${stackSpread} => ${dorito}',
          fr: '${stackSpread} => ${dorito}',
          ja: '${stackSpread} => ${dorito}',
          cn: '${stackSpread} => ${dorito}',
          ko: '${stackSpread} => ${dorito}',
        },
      },
    },
    {
      id: 'QueenEternal Ex Rush',
      type: 'StartsUsing',
      netRegex: { id: ['A037', 'A038'], source: 'Ice Pillar', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread, stretch tethers',
        },
      },
    },
  ],
};

export default triggerSet;
