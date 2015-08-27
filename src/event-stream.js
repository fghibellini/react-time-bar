
var rx = require("rx");

require("./rx-operators");

export function genStreamStructure(document) {
    var mouseDowns = rx.Observable.fromEvent(document, 'mousedown');
    var mouseUps = rx.Observable.fromEvent(document, 'mouseup');
    var mouseMoves = rx.Observable.fromEvent(document, 'mousemove');

    var mouseStream = mouseDowns.flatMap(function(e) {
        return rx.Observable.return(e).concat(mouseMoves.takeUntilJoined(mouseUps));
    });

    var terminationSubject = new rx.Subject();

    var terminatedMouseStream = mouseStream.takeUntilJoined(terminationSubject);

    return {
        terminationObserver: terminationSubject,
        observable: terminatedMouseStream
    };
}
