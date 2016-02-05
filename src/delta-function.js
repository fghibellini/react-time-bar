
import { TimeBarState, MouseDraggingAction, TouchDraggingAction, isDraggingAction, PreviewAction, TERMINATION_MSG } from './state';
import { setCursorToWholeDocument, unsetCursorToWholeDocument } from './functions/global-cursor';
import { getRemovedIds } from './functions/utils';

function dragStart(state, intervalId, side, initialCoords, timeBeforeDrag) {
    var newState = state.set("action", new MouseDraggingAction({
        intervalId: intervalId,
        side: side,
        initialCoords: initialCoords,
        timeBeforeDrag: timeBeforeDrag,
        movedSinceMouseDown: false
    }));
    return newState;
}

function getCursorName(direction, side) {
    return {
        horizontal: {
            left: "w-resize",
            right: "e-resize",
            whole: "ew-resize"
        },
        vertical: {
            left: "n-resize",
            right: "s-resize",
            whole: "ns-resize"
        }
    }[direction][side];
}

function mouse_drag(state, newCoords) {
    var {
        max, width, direction,
        onStartChange, onEndChange, onIntervalDrag,
        action: {
            intervalId, side,
            timeBeforeDrag, initialCoords,
            movedSinceMouseDown
        }
    } = state;

    var [oldPos, newPos] = (direction == 'horizontal') ? [initialCoords.x, newCoords.clientX] : [initialCoords.y, newCoords.clientY];
    var deltaPx = newPos - oldPos;
    var newTime = timeBeforeDrag + max * deltaPx / width;

    if (side === "left") {
        onStartChange(intervalId, newTime);
    } else if (side === "right") {
        onEndChange(intervalId, newTime);
    } else if (side === "whole") {
        onIntervalDrag(intervalId, newTime);
    }

    if (!movedSinceMouseDown) {
        var cursorName = getCursorName(direction, side);
        setCursorToWholeDocument(window.document, cursorName);

        var newDraggingAction = state.action.set("movedSinceMouseDown", true);
        var newState = state.set("action", newDraggingAction);
        return newState;
    } else {
        return state;
    }
}

function touch_drag(state, newCoords) {
    var {
        max, width, direction,
        onStartChange, onEndChange, onIntervalDrag,
        action: {
            intervalId, side, touchId,
            timeBeforeDrag, initialCoords,
            movedSinceTouchStart
        }
    } = state;

    if (newCoords.touchId !== touchId) {
        return state;
    }

    var [oldPos, newPos] = (direction == 'horizontal') ? [initialCoords.x, newCoords.clientX] : [initialCoords.y, newCoords.clientY];
    var deltaPx = newPos - oldPos;
    var newTime = timeBeforeDrag + max * deltaPx / width;

    if (side === "left") {
        onStartChange(intervalId, newTime);
    } else if (side === "right") {
        onEndChange(intervalId, newTime);
    } else if (side === "whole") {
        onIntervalDrag(intervalId, newTime);
    }

    if (!movedSinceTouchStart) {
        var cursorName = getCursorName(direction, side);
        setCursorToWholeDocument(window.document, cursorName);

        var newDraggingAction = state.action.set("movedSinceTouchStart", true);
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
        if (action && isDraggingAction(action)) {
            newState = dragEnd(state, capturedMouseEvents);
        }
        terminate();
    } else if (input.type === "bar-mousemove") {
        newState = state.set("action", new PreviewAction({ offset: input.offset }));
    } else if (input.type === "bar-mouseleave") {
        if (action && action instanceof PreviewAction) {
            newState = state.set("action", null);
        }
    } else if (input.type === "mousedown") {
        var { intervalId, side, initialCoords, timeBeforeDrag } = input;
        capturedMouseEvents.resume();
        newState = dragStart(state, intervalId, side, initialCoords, timeBeforeDrag);
    } else if (input.type === "touchstart") {
        var { intervalId, side, initialCoords, timeBeforeDrag } = input;
        newState = state.set("action", new TouchDraggingAction({
            intervalId: intervalId,
            side: side,
            touchId: input.touchId,
            initialCoords: initialCoords,
            timeBeforeDrag: timeBeforeDrag,
            movedSinceTouchStart: false
        }));
        dragStart(state, intervalId, side, initialCoords, timeBeforeDrag);
    } else if (input.type === "mousemove") {
        if (action && action instanceof MouseDraggingAction) {
            newState = mouse_drag(state, input);
        }
    } else if (input.type === "touchmove") {
        if (action && action instanceof TouchDraggingAction) {
            newState = touch_drag(state, input);
        }
    } else if (input.type === "mouseup") {
        if (action instanceof MouseDraggingAction) {
            var { intervalId, movedSinceMouseDown } = action;
            if (!movedSinceMouseDown) {
                onIntervalClick(intervalId, null);
            } else {
                onDragEnd(intervalId);
            }
            newState = dragEnd(state, capturedMouseEvents);
        }
    } else if (input.type === "touchend") {
        if (action instanceof TouchDraggingAction) {
            var { intervalId, touchId, movedSinceTouchStart } = action;
            if (touchId === input.touchId) {
                if (!movedSinceTouchStart) {
                    onIntervalClick(intervalId, null);
                } else {
                    onDragEnd(intervalId);
                }
                newState = dragEnd(state, capturedMouseEvents);
            }
        }
    } else if (input.type === "propchange") {
        var { newProps } = input;
        if (action && isDraggingAction(action)) {
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
