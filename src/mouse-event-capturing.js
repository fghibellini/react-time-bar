
var rx = require("rx");

require("rx-dom");

/**
 * Returns an observable that captures and stops the propagation of all the mouseups and mousemoves on the passed domNode.
 */
export function captureMouseEventsOnDomNode(domNode) {
    var mouseUps   = rx.DOM.fromEvent(domNode, 'mouseup', null, true);
    var mouseMoves = rx.DOM.fromEvent(domNode, 'mousemove', null, true);
    /*
    var touchEnds = rx.DOM.fromEvent(domNode, 'touchend', null, true);
    var touchMoves = rx.DOM.fromEvent(domNode, 'touchmove', null, true);
    */
    var inputStreams = rx.Observable.merge([mouseUps, mouseMoves/*, touchEnds, touchMoves*/]).do(e => e.stopPropagation());
    return inputStreams;
}

