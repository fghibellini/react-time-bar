
import { timeStrToMinutes, minutesToStr } from '../src/functions/time-functions';

var _ = require("lodash"),
    range = _.range;

/**
 * Maps a number to a sequence of "random" intervals.
 * Useful when you need some chaning intervals although
 * you don't care what their attributes are.
 *
 * @arg {number} iterator null the random seed
 * @arg {number} start
 */
export function genTimeBarSet(start, end, intervalDuration, intervalCount, iterator) {
    var startInMinutes = timeStrToMinutes(start);
    var endInMinutes = timeStrToMinutes(end);
    var maxDistanceFromStart = endInMinutes - intervalDuration - startInMinutes;

    var nthStart = n => minutesToStr(startInMinutes + ((iterator + n) % maxDistanceFromStart));
    var nthEnd   = n => minutesToStr(startInMinutes + ((iterator + n) % maxDistanceFromStart) + intervalDuration);

    return range(intervalCount).map(n => {
        return { ints: [ { id: 0, from: nthStart(n), to: nthEnd(n) } ] };
    });
}
