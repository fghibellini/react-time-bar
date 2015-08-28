
var rx = require("rx");

require("./rx-operators");

/**
 * Returns an rx observable and rx observers for input from
 * the component.
 *
 * The updates can be one of:
 *  - mousedown (md)
 *  - mouseups (mu)
 *  - mousemove (mm)
 *  - termination signal (tm)
 *
 * The updates follow this grammar:
 * (md (mm)* mu)* (md (mm)*)? tm
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
    var terminationSubject = new rx.Subject();

    var mouseStream = mouseDowns.flatMap(function(e) {
        return rx.Observable.return(e).concat(mouseMoves.takeUntilJoined(mouseUps));
    });

    var terminatedMouseStream = mouseStream.takeUntilJoined(terminationSubject);

    return {
        observable: terminatedMouseStream,
        mouseDownObserver: mouseDowns,
        terminationObserver: terminationSubject
    };
}
