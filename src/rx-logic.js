
var rx = require("rx");

require("./rx-operators");

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
    var removedElements = new rx.Subject();
    var terminationSubject = new rx.Subject();

    var mouseStream = mouseDowns.flatMap(function(e) {
        var draggedElementRemoved = removedElements.filter(update => update.intervalId === e.intervalId);
        var dragTermination = mouseUps.merge(draggedElementRemoved);
        return rx.Observable.return(e).concat(mouseMoves.takeUntilJoined(dragTermination));
    });

    var terminatedMouseStream = mouseStream.takeUntilJoined(terminationSubject);

    return {
        observable: terminatedMouseStream,
        mouseDownObserver: mouseDowns,
        elementRemovedObserver: removedElements,
        terminationObserver: terminationSubject
    };
}
