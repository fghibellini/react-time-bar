
var rx = require("rx");

require("./rx-operators");

function getRemovedIds(oldIntervals, newIntervals) {
    var removed = [];
    outer:
    for (var i = 0, ii = oldIntervals.length; i < ii; i++) {
        var oldId = oldIntervals[i].id;
        for (var j = 0, jj = newIntervals.length; j < jj; j++) {
            if (oldId == newIntervals[j].id) {
                continue outer;
            }
        }
        removed.push(oldId);
    }
    return removed;
}


/**
 * Returns an rx observable and rx observers for input from
 * the component.
 *
 * The updates can be one of:
 *  - mousedown (md)
 *  - mousemove (mm)
 *  - mouseups (mu)
 *  - element removed (er)
 *  - termination signal (tm)
 *
 * The updates follow this grammar:
 * (md (mm)* (mu | er))* (md (mm)*)? tm
 *
 * mouseups & mousemoves
 * ---------------------
 * Mouse events from the document element.
 *
 * mousedowns
 * ----------
 * These are triggered by the component events since we
 * need to preserve information about on which element
 * the drag started.
 *
 * elementRemoved
 * --------------
 * Signals that one of the intervals was removed from
 * the passed prop.
 *
 * termination signal
 * ------------------
 * An update on this stream signals the component will be
 * unmounted.
 *
 */
export function setupRxLogic(document) {
    var mouseDowns = new rx.Subject();
    var mouseUps   = rx.Observable.fromEvent(document, 'mouseup');
    var mouseMoves = rx.Observable.fromEvent(document, 'mousemove');
    var propertyChanges = new rx.Subject();
    var terminationSubject = new rx.Subject();

    var mouseStream = mouseDowns.flatMap(function(e) {
        var draggedIntervalId = e.intervalId;

        var draggedElementRemoved = propertyChanges.filter(update => {
            var { newProps, oldProps } = update;
            var removedIds = getRemovedIds(oldProps.intervals, newProps.intervals);
            return !! ~removedIds.indexOf(draggedIntervalId);
        }).do(x => console.log("dragged element removed"));

        var otherPropUpdates = propertyChanges.filter(update => {
            var { newProps, oldProps } = update;
            var removedIds = getRemovedIds(oldProps.intervals, newProps.intervals);
            return ! ~removedIds.indexOf(draggedIntervalId);
        }).do(x => console.log("some other property changed"));

        var dragTermination = mouseUps.merge(draggedElementRemoved);

        return rx.Observable.return(e).concat(mouseMoves.takeUntilJoined(dragTermination))
            .merge(otherPropUpdates); // should be mergeSeq
    });

    var terminatedMouseStream = mouseStream.takeUntilJoined(terminationSubject);

    return {
        observable: terminatedMouseStream,
        mouseDownObserver: mouseDowns,
        propertyChangeObserver: propertyChanges,
        terminationObserver: terminationSubject
    };
}
