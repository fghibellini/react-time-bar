
var rx = require("rx");

require("rx-dom");

/**
 * Returns an observable that captures and stops the propagation of all the mouseups and mousemoves on the passed domNode.
 */
export function captureMouseEventsOnDomNode(domNode) {
    var mouseUps   = rx.DOM.fromEvent(domNode, 'mouseup', null, true);
    var mouseMoves = rx.DOM.fromEvent(domNode, 'mousemove', null, true);
    var inputStreams = rx.Observable.merge([mouseUps, mouseMoves]).do(e => e.stopPropagation());
    return inputStreams;
}

