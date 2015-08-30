
var rx = require("rx"),
    mergeObservables = rx.Observable.merge;

import { timeStrToMinutes, minutesToStr } from './time-functions';

export var noop = rx.helpers.noop;

export function mergeInputs(inputObservables) {
    return mergeObservables
        .apply(null, inputObservables)
        .observeOn(rx.Scheduler.default);
}

export function getRemovedIds(oldIntervals, newIntervals) {
    var removed = [];
    outer:
    for (var i = 0, ii = oldIntervals.size; i < ii; i++) {
        var oldId = oldIntervals.get(i).id;
        for (var j = 0, jj = newIntervals.size; j < jj; j++) {
            if (oldId == newIntervals.get(j).id) {
                continue outer;
            }
        }
        removed.push(oldId);
    }
    return removed;
}

function computeDeltaInMinutes(min, max, width, deltaPx) {
    var minMinutes = timeStrToMinutes(min);
    var maxMinutes = timeStrToMinutes(max);
    var intervalDuration = maxMinutes - minMinutes;
    var pixelDuration = intervalDuration / width;
    return Math.round(deltaPx * pixelDuration);
}

export function modifyTimeByPixels(min, max, width, t0, deltaPx) {
    var deltaMinutes = computeDeltaInMinutes(min, max, width, deltaPx);
    var t0InMinutes = timeStrToMinutes(t0);

    return minutesToStr(t0InMinutes + deltaMinutes);
}

