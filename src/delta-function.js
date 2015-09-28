
import { TimeBarState, DraggingAction, PreviewAction, TERMINATION_MSG } from './state';
import { setCursorToWholeDocument, unsetCursorToWholeDocument } from './functions/global-cursor';
import { getRemovedIds } from './functions/utils';

function dragStart(state, intervalId, side, initialCoords, timeBeforeDrag) {
    var newState = state.set("action", new DraggingAction({
        intervalId: intervalId,
        side: side,
        initialCoords: initialCoords,
        timeBeforeDrag: timeBeforeDrag,
        movedSinceMouseDown: false
    }));
    return newState;
}

function drag(state, newCoords) {
    var {
        max, width,
        onStartChange, onEndChange, onIntervalDrag,
        action: {
            intervalId, side,
            timeBeforeDrag, initialCoords,
            movedSinceMouseDown
        }
    } = state;

    var deltaPx = newCoords.clientX - initialCoords.x;
    var newTime = timeBeforeDrag + max * deltaPx / width;

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

        var newDraggingAction = state.action.set("movedSinceMouseDown", true);
        var newState = state.set("action", newDraggingAction);
        return newState;
    } else {
        return state;
    }
}

function dragEnd(state, capturedMouseEvents) {
    var { action: { intervalId, movedSinceMouseDown }, onIntervalClick } = state;

    if (movedSinceMouseDown) {
        unsetCursorToWholeDocument(window.document);
    }

    capturedMouseEvents.pause();
    var newState = state.set("action", null);
    return newState;
}

export function deltaFunction(state, input, stream, environment, terminate) {
    var { action, onIntervalClick, onDragEnd } = state;
    var { capturedMouseEvents } = environment;

    var newState = state;

    if (input === TERMINATION_MSG) {
        if (action && action instanceof DraggingAction) {
            newState = dragEnd(state, capturedMouseEvents);
        }
        terminate();
    } else if (input.type === "bar-mousemove") {
        newState = state.set("action", new PreviewAction({ x: input.x }));
    } else if (input.type === "bar-mouseleave") {
        if (action && action instanceof PreviewAction) {
            newState = state.set("action", null);
        }
    } else if (input.type === "mousedown") {
        var { intervalId, side, initialCoords, timeBeforeDrag } = input;
        capturedMouseEvents.resume();
        newState = dragStart(state, intervalId, side, initialCoords, timeBeforeDrag);
    } else if (input.type === "mousemove") {
        if (action && action instanceof DraggingAction) {
            newState = drag(state, input);
        }
    } else if (input.type === "mouseup") {
        if (action && action instanceof DraggingAction) {
            var { intervalId, movedSinceMouseDown } = action;
            if (!movedSinceMouseDown) {
                onIntervalClick(intervalId, null);
            } else {
                onDragEnd(intervalId);
            }
            newState = dragEnd(state, capturedMouseEvents);
        }
    } else if (input.type === "propchange") {
        var { newProps } = input;
        if (action && action instanceof DraggingAction) {
            var { intervalId } = action;
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
