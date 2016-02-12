
var rx = require("rx");

require("rx-dom");

import { GLOBAL_MOUSE_MOVE, GLOBAL_MOUSE_UP } from './events';

/**
 * Returns an observable that captures and stops the propagation of all the mouseups and mousemoves on the passed domNode.
 */
export function captureMouseEventsOnDomNode(domNode) {
    var mouseUps = rx.DOM.fromEvent(domNode, 'mouseup', null, true).map(e => {
        e.preventDefault();
        e.stopPropagation();
        return {
            type: GLOBAL_MOUSE_UP,
            clientX: e.clientX,
            clientY: e.clientY
        };
    });
    var mouseMoves = rx.DOM.fromEvent(domNode, 'mousemove', null, true).map(e => {
        e.preventDefault();
        e.stopPropagation();
        return {
            type: GLOBAL_MOUSE_MOVE,
            clientX: e.clientX,
            clientY: e.clientY
        };
    });

    var inputStreams = rx.Observable.merge([mouseUps, mouseMoves]);
    return inputStreams;
}

