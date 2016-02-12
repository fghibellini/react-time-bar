
import { TimeBarState, MouseDraggingAction, TouchDraggingAction, isDraggingAction, PreviewAction, TERMINATION_MSG, FirstPressed, FirstReleased, SecondPressed } from './state';
import { setCursorToWholeDocument, unsetCursorToWholeDocument } from './functions/global-cursor';
import { getRemovedIds, noop } from './functions/utils';
import { O1Map } from './o1map';
import { BAR_TOUCH_START, BAR_TOUCH_END, BAR_LONG_PRESS, BAR_SINGLE_TAP, BAR_MOUSE_MOVE, BAR_MOUSE_LEAVE, INTERVAL_MOUSE_DOWN, GLOBAL_MOUSE_MOVE, GLOBAL_MOUSE_UP, INTERVAL_TOUCH_START, INTERVAL_TOUCH_MOVE, INTERVAL_TOUCH_END, INTERVAL_LONG_PRESS } from './events';


export var stateExitClearTimeoutHooks = new O1Map()
    .set(FirstPressed, function(state, input, nextState) { if (input.type !== BAR_LONG_PRESS) clearTimeout(state.action.longPressTimeoutId); })
    .set(FirstReleased, function(state, input, nextState) { if (input.type !== BAR_SINGLE_TAP) clearTimeout(state.action.singleTapTimeoutId); })
    .set(SecondPressed, function(state, input, nextState) { if (input.type !== BAR_LONG_PRESS) clearTimeout(state.action.longPressTimeoutId); })
    .set(MouseDraggingAction, function(state, input, nextState) {
        if (input.type !== GLOBAL_MOUSE_UP) {
            var { action: { movedSinceMouseDown, capturedMouseEvents } } = state;
            if (movedSinceMouseDown) {
                unsetCursorToWholeDocument(window.document);
            }
            capturedMouseEvents.pause();
        }
    });

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

function computeDistance(oldCoords, newCoords) {
    var deltaX = oldCoords.x - newCoords.clientX;
    var deltaY = oldCoords.y - newCoords.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

export function newInterval(state, input) {
    /*
    var offset = e.client; // TODO compute
    var startTime = max * offset / width;
    var bounds = previewBoundsGenerator(startTime, max, intervals.toJS());
    if (bounds) {
    }
    // TODO onIntervalNew(bounds);
    */
}

export function processTimeBarTouchEvent(state, input, stream) {
    var { action, onIntervalNew, onDoubleTap, onLongPress, onTap, onDoubleLongPress } = state;
    var { coords } = input;

    var newState = state;

    if (action instanceof FirstPressed && input.type === BAR_TOUCH_END) {
        if (onDoubleTap === noop) {
            newState = state.set("action", null);
            onTap();
        } else {
            newState = state.set("action", new FirstReleased({
                singleTapTimeoutId: setTimeout(function() {
                    // single-tap timeout
                    stream.onNext({
                        type: BAR_SINGLE_TAP,
                        touchId: input.touchId
                    });
                }, 300)
            }));
        }
    } else if (action instanceof FirstPressed && input.type === BAR_LONG_PRESS) {
        newState = state.set("action", null);
        onLongPress();
    } else if (action instanceof FirstReleased && input.type === BAR_SINGLE_TAP) {
        newState = state.set("action", null);
        onTap();
    } else if (action instanceof FirstReleased && input.type === BAR_TOUCH_START) {
        newState = state.set("action", new SecondPressed({
            longPressTimeoutId: setTimeout(function() {
                // longpress
                stream.onNext({
                    type: BAR_LONG_PRESS,
                    touchId: input.touchId
                });
            }, 600)
        }));
    } else if (action instanceof SecondPressed && input.type === BAR_TOUCH_END) {
        newState = state.set("action", null);
        onDoubleTap();
    } else if (action instanceof SecondPressed && input.type === BAR_LONG_PRESS) {
        newState = state.set("action", null);
        onDoubleLongPress();
    } else if (input.type === BAR_TOUCH_START) {
        newState = state.set("action", new FirstPressed({
            longPressTimeoutId: setTimeout(function() {
                stream.onNext({
                    type: BAR_LONG_PRESS,
                    touchId: input.touchId
                });
            }, 600)
        }));
    } else if (input.type === BAR_TOUCH_END) {
        /**
         * residual touch
         *
         * this happens for example after a longpress
         *
         * it would be better to set a special state when
         * we transit to the null action carrying the information
         * that we will transit into the default state as soon as
         * the touch ends
         */
        //console.log("residual touch");
    } else {
        console.error("Unexpected state-input combination!");
        console.error(state.action ? state.action.toJS() : "<no action>");
        console.error(input);
    }
    return newState;
}

function processPreviewEvent(state, input) {
    var newState = state;

    if (input.type === BAR_MOUSE_MOVE) {
        newState = state.set("action", new PreviewAction({ offset: input.offset }));
    } else if (state.action instanceof PreviewAction && input.type === BAR_MOUSE_LEAVE) {
        newState = state.set("action", null);
    }

    return newState;
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

function processIntervalMouseEvent(state, input, env) {
    var { action, onIntervalClick, onDragEnd, onLongPress } = state;
    var newState = state;

    console.log("got to processIntervalMouseEvent!");
    if (input.type === INTERVAL_MOUSE_DOWN) {
        var { intervalId, side, initialCoords, timeBeforeDrag } = input;
        env.capturedMouseEvents.resume();
        newState = state.set("action", new MouseDraggingAction({
            intervalId: intervalId,
            side: side,
            initialCoords: initialCoords,
            timeBeforeDrag: timeBeforeDrag,
            movedSinceMouseDown: false,
            capturedMouseEvents: env.capturedMouseEvents
        }));
    } else if (input.type === GLOBAL_MOUSE_MOVE && action instanceof MouseDraggingAction) {
        console.log("got to GLOBAL_MOUSE_MOVE!");
        newState = mouse_drag(state, input);
    } else if (input.type === GLOBAL_MOUSE_UP && action instanceof MouseDraggingAction) {
        var { intervalId, movedSinceMouseDown, capturedMouseEvents } = action;
        if (!movedSinceMouseDown) {
            onIntervalClick(intervalId, null);
        } else {
            unsetCursorToWholeDocument(window.document);
            onDragEnd(intervalId);
        }
        capturedMouseEvents.pause();
        newState = state.set("action", null);
    }

    return newState;
}

function touch_drag(state, touchEvent) {
    var {
        max, width, direction,
        onStartChange, onEndChange, onIntervalDrag,
        touchMoveRadius,
        action: {
            intervalId, side, touchId,
            timeBeforeDrag, initialCoords,
            movedSinceTouchStart
        }
    } = state;

    if (touchEvent.touchId !== touchId) { // TODO unify where touchId is checked
        return state;
    }

    var [oldPos, newPos] = (direction == 'horizontal') ? [initialCoords.x, touchEvent.clientX] : [initialCoords.y, touchEvent.clientY];
    var deltaPx = newPos - oldPos;
    var newTime = timeBeforeDrag + max * deltaPx / width;

    var newState = state;

    if (!movedSinceTouchStart && (computeDistance(initialCoords, touchEvent) > touchMoveRadius)) {
        var newDraggingAction = state.action.set("movedSinceTouchStart", true);
        newState = state.set("action", newDraggingAction);
    }

    if (movedSinceTouchStart) {
        if (side === "left") {
            onStartChange(intervalId, newTime);
        } else if (side === "right") {
            onEndChange(intervalId, newTime);
        } else if (side === "whole") {
            onIntervalDrag(intervalId, newTime);
        }
    }

    return newState;
}

function processIntervalTouchEvent(state, input, stream) {
    var { action, onIntervalClick, onDragEnd, onLongPress } = state;
    var newState = state;

    if (input.type === INTERVAL_TOUCH_START) {
        var { intervalId, side, initialCoords, timeBeforeDrag, touchId } = input;
        var longPressTimeoutId = setTimeout(function() {
            stream.onNext({
                type: INTERVAL_LONG_PRESS,
                touchId: touchId
            });
        }, state.longPressInterval);
        newState = state.set("action", new TouchDraggingAction({
            intervalId: intervalId,
            side: side,
            touchId: touchId,
            longPressTimeoutId: longPressTimeoutId,
            t0: new Date(),
            initialCoords: initialCoords,
            timeBeforeDrag: timeBeforeDrag,
            movedSinceTouchStart: false
        }));
    } else if (action instanceof TouchDraggingAction && input.type === INTERVAL_TOUCH_MOVE) {
        newState = touch_drag(state, input);
    } else if (action instanceof TouchDraggingAction && input.type === INTERVAL_TOUCH_END) {
        var { intervalId, touchId, movedSinceTouchStart } = action;
        if (touchId === input.touchId) {
            newState = state.set("action", null);
            if (!movedSinceTouchStart) {
                // TODO touchEnd when interrupted by other actions
                onIntervalClick(intervalId, null); // TODO separete on touchEnd and onTap events
            }
        }
    } else if (action instanceof TouchDraggingAction && input.type === INTERVAL_LONG_PRESS) {
        if (action.touchId === input.touchId && !state.action.movedSinceTouchStart && state.onLongPress !== noop) {
            newState = state.set("action", null);
            onLongPress(action.intervalId);
        }
    }

    return newState;
}

export function deltaFunction(state, input, stream, environment, terminate) {
    var { action, onIntervalClick, onDragEnd, onLongPress } = state;

    var newState = state;

    if (input === TERMINATION_MSG) {
        newState = state.set("action", null);
        terminate();
    } else if (input.type === "propchange") {
        var { newProps } = input;
        if (isDraggingAction(action)) {
            var { intervalId } = action;
            var removedElements = getRemovedIds(state.intervals, newProps.intervals);
            if (~removedElements.indexOf(intervalId)) {
                newState = state.set("action", null);
            }
        }
        newState = newState.merge(newProps);
    } else if (input.type === BAR_TOUCH_START || state.action instanceof FirstPressed || state.action instanceof FirstReleased || state.action instanceof SecondPressed ) {
        newState = processTimeBarTouchEvent(state, input, stream);
    } else if (input.type === BAR_MOUSE_MOVE || state.action instanceof PreviewAction) {
        newState = processPreviewEvent(state, input);
    } else if (input.type === INTERVAL_MOUSE_DOWN || state.action instanceof MouseDraggingAction) {
        newState = processIntervalMouseEvent(state, input, environment);
    } else if (input.type === INTERVAL_TOUCH_START || state.action instanceof TouchDraggingAction) {
        newState = processIntervalTouchEvent(state, input, stream);
    } else {
        console.error("unexpected type of input; ignoring");
    }

    return newState;
}
