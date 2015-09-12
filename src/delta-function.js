
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

function dragEnd(state, capturedMouseEvents) {
    var { dragging: { intervalId, movedSinceMouseDown }, onIntervalClick  } = state;

    if (movedSinceMouseDown) {
        unsetCursorToWholeDocument(window.document);
    }

    capturedMouseEvents.pause();
    var newState = state.set("dragging", null);
    return newState;
}

export function deltaFunction(state, input, stream, environment, terminate) {
    var { dragging } = state;
    var { capturedMouseEvents } = environment;

    var newState = state;

    if (input === TERMINATION_MSG) {
        if (dragging) {
            newState = dragEnd(state, capturedMouseEvents);
        }
        terminate();
    } else if (input.type === "bar-mousemove") {
        newState = state.set("displayNewIntPreview", true).set("potentialIntervalX", input.x);
    } else if (input.type === "bar-mouseleave") {
        newState = state.set("displayNewIntPreview", false);
    } else if (input.type === "mousedown") {
        var { intervalId, side, initialCoords, timeBeforeDrag } = input;
        capturedMouseEvents.resume();
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
            newState = dragEnd(state, capturedMouseEvents);
        }
    } else if (input.type === "propchange") {
        var { newProps } = input;
        if (dragging) {
            var { intervalId } = dragging;
            var removedElements = getRemovedIds(state.intervals, newProps.intervals);
            if (~removedElements.indexOf(intervalId)) {
                newState = dragEnd(state, capturedMouseEvents);
            }
        }
        newState = newState.merge(newProps);
    } else {
        console.error("unexpected type of input; ignoring");
    }

    return newState;
}
