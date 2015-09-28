
var rx = require("rx"),
    mergeObservables = rx.Observable.merge;

export var noop = rx.helpers.noop;

export function mergeInputs(inputObservables) {
    return mergeObservables
        .apply(null, inputObservables);
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
