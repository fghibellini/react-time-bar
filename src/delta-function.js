
import { TimeBarState, DraggingState, TERMINATION_MSG } from './state';
import { setCursorToWholeDocument, unsetCursorToWholeDocument } from './functions/global-cursor';
import { getRemovedIds, modifyTimeByPixels } from './functions/utils';

function dragStart(state, intervalId, side, initialCoords, timeBeforeDrag) {
    var newState = state.set("dragging", new DraggingState({
        intervalId: intervalId,
        side: side,
        initialCoords: initialCoords,
        timeBeforeDrag: timeBeforeDrag,
        movedSinceMouseDown: false
    }));
    return newState;
}

function drag(state, newCoords) {
    var { dragging, min, max, width, onStartChange, onEndChange, onIntervalDrag } = state;
    var { intervalId, side, timeBeforeDrag, initialCoords, movedSinceMouseDown } = dragging;

    var newTime = modifyTimeByPixels(min, max, width, timeBeforeDrag, newCoords.x - initialCoords.x);

    if (side === "left") {
        onStartChange(intervalId, newTime);
    } else if (side === "right") {
        onEndChange(intervalId, newTime);
    } else if (side === "whole") {
        onIntervalDrag(intervalId, newTime);
    }

    if (!movedSinceMouseDown) {
        var cursorName = {
            left: "w-resize",
            right: "e-resize",
            whole: "move"
        }[side];
        setCursorToWholeDocument(window.document, cursorName);

        var newDraggingState = dragging.set("movedSinceMouseDown", true);
        var newState = state.set("dragging", newDraggingState);
        return newState;
    } else {
        return state;
    }
}

function dragEnd(state) {
    var { dragging: { intervalId, movedSinceMouseDown }, onIntervalClick  } = state;

    if (movedSinceMouseDown) {
        unsetCursorToWholeDocument(window.document);
    }

    var newState = state.set("dragging", null);
    return newState;
}

export function deltaFunction(state, input, stream, terminate) {
    var { dragging } = state;

    var newState = state;

    if (input === TERMINATION_MSG) {
        if (dragging) {
            newState = dragEnd(state);
        }
        terminate();
    } else if (input.type === "mousedown") {
        var { intervalId, side, initialCoords, timeBeforeDrag } = input;
        newState = dragStart(state, intervalId, side, initialCoords, timeBeforeDrag);
    } else if (input.type === "mousemove") {
        if (dragging) {
            newState = drag(state, input);
        }
    } else if (input.type === "mouseup") {
        if (dragging) {
            var { dragging, onIntervalClick } = state;
            var { intervalId, movedSinceMouseDown } = dragging;
            if (!movedSinceMouseDown) {
                onIntervalClick(intervalId, null);
            }
            newState = dragEnd(state);
        }
    } else if (input.type === "propchange") {
        var { newProps } = input;
        if (dragging) {
            var { intervalId } = dragging;
            var removedElements = getRemovedIds(state.intervals, newProps.intervals);
            if (~removedElements.indexOf(intervalId)) {
                newState = dragEnd(state);
            }
        }
        newState = newState.merge(newProps);
    } else {
        console.error("unexpected type of input; ignoring");
    }

    return newState;
}
