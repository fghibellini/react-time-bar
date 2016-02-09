
import { TimeBarState, MouseDraggingAction, TouchDraggingAction, isDraggingAction, PreviewAction, TERMINATION_MSG, FirstPressed, FirstReleased, SecondPressed } from './state';
import { setCursorToWholeDocument, unsetCursorToWholeDocument } from './functions/global-cursor';
import { getRemovedIds, noop } from './functions/utils';
import { O1Map } from './o1map';
import { BAR_TOUCH_START, BAR_TOUCH_END, BAR_LONG_PRESS, BAR_SINGLE_TAP } from './events';

export var stateExitClearTimeoutHooks = new O1Map()
    .set(FirstPressed, function(state, input, nextState) { if (input.type !== BAR_LONG_PRESS) clearTimeout(state.longPressTimeoutId); })
    .set(FirstReleased, function(state, input, nextState) { if (input.type !== BAR_SINGLE_TAP) clearTimeout(state.singleTapTimeoutId); })
    .set(SecondPressed, function(state, input, nextState) { if (input.type !== BAR_LONG_PRESS) clearTimeout(state.longPressTimeoutId); });

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

function computeDistance(oldCoords, newCoords) {
    var deltaX = oldCoords.x - newCoords.clientX;
    var deltaY = oldCoords.y - newCoords.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
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

    if (touchEvent.touchId !== touchId) {
        return state;
    }

    var [oldPos, newPos] = (direction == 'horizontal') ? [initialCoords.x, touchEvent.clientX] : [initialCoords.y, touchEvent.clientY];
    var deltaPx = newPos - oldPos;
    var newTime = timeBeforeDrag + max * deltaPx / width;

    var newState = state;

    if (!movedSinceTouchStart && (computeDistance(initialCoords, touchEvent) > touchMoveRadius)) {
        console.log("touch drag start!");
        var cursorName = getCursorName(direction, side);
        setCursorToWholeDocument(window.document, cursorName);

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
    var { action, onIntervalNew, onDoubleTap } = state;
    var { coords } = input;

    var newState = state;

    if (action instanceof FirstPressed && input.type === BAR_TOUCH_END) {
        //console.log("touch end!");
        if (onDoubleTap === noop) {
            newState = state.set("action", null);
            // TODO single tap
            console.log("SINGLE-TAP");
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
        // TODO longpress
        console.log("LONGPRESS");
    } else if (action instanceof FirstReleased && input.type === BAR_SINGLE_TAP) {
        console.log("SINGLE-TAP");
        newState = state.set("action", null);
    } else if (action instanceof FirstReleased && input.type === BAR_TOUCH_START) {
        newState = state.set("action", new SecondPressed({
            longPressTimeoutId: setTimeout(function() {
                // longpress
                stream.onNext({
                    type: BAR_LONG_PRESS,
                    touchId: input.touchId
                });
            }, 800)
        }));
    } else if (action instanceof SecondPressed && input.type === BAR_TOUCH_END) {
        // TODO doble-tap
        console.log("DOUBLE-TAP");
        newState = state.set("action", null);
    } else if (action instanceof SecondPressed && input.type === BAR_LONG_PRESS) {
        // TODO longpress
        console.log("DOUBLE-LONGPRESS");
        newState = state.set("action", null);
    } else if (input.type === BAR_TOUCH_START) {
        //console.log("touch start!");
        newState = state.set("action", new FirstPressed({
            longPressTimeoutId: setTimeout(function() {
                // longpress
                stream.onNext({
                    type: BAR_LONG_PRESS,
                    touchId: input.touchId
                });
            }, 800)
        }));
    } else if (input.type === BAR_TOUCH_END) {
        // residual touch
        //console.log("residual touch");
        /**
         * it would be better to set a special state when
         * we transit to the null action carrying the information
         * that we will transit into the default state as soon as
         * the touch ends
         */
    } else {
        console.error("Unexpected state-input combination!");
        console.error(state.action.toJS());
        console.error(input);
    }
    return newState;
}

export function deltaFunction(state, input, stream, environment, terminate) {
    var { action, onIntervalClick, onDragEnd, onLongPress } = state;
    var { capturedMouseEvents } = environment;

    var newState = state;

    if (input === TERMINATION_MSG) {
        if (action instanceof MouseDraggingAction) {
            var { movedSinceMouseDown } = action;
            if (movedSinceMouseDown) {
                unsetCursorToWholeDocument(window.document);
            }
            capturedMouseEvents.pause();
            newState = state.set("action", null);
        } else if (action instanceof TouchDraggingAction) {
            newState = state.set("action", null);
        }
        terminate();
    } else if (input.type === "propchange") {
        var { newProps } = input;
        if (isDraggingAction(action)) {
            var { intervalId } = action;
            var removedElements = getRemovedIds(state.intervals, newProps.intervals);
            if (~removedElements.indexOf(intervalId)) {
                if (action instanceof MouseDraggingAction) {
                    var { movedSinceMouseDown } = action;
                    if (movedSinceMouseDown) {
                        unsetCursorToWholeDocument(window.document);
                    }
                    capturedMouseEvents.pause();
                    newState = state.set("action", null);
                } else {
                    newState = state.set("action", null);
                }
            }
        }
        newState = newState.merge(newProps);
    } else if (input.type === BAR_TOUCH_START || input.type ===  BAR_TOUCH_END || input.type === BAR_LONG_PRESS || input.type === BAR_SINGLE_TAP) {
        newState = processTimeBarTouchEvent(state, input, stream);
    } else if (input.type === "bar-mousemove") {
        newState = state.set("action", new PreviewAction({ offset: input.offset }));
    } else if (input.type === "bar-mouseleave") {
        if (action instanceof PreviewAction) {
            newState = state.set("action", null);
        }
    } else if (input.type === "mousedown") {
        var { intervalId, side, initialCoords, timeBeforeDrag } = input;
        capturedMouseEvents.resume();
        newState = state.set("action", new MouseDraggingAction({
            intervalId: intervalId,
            side: side,
            initialCoords: initialCoords,
            timeBeforeDrag: timeBeforeDrag,
            movedSinceMouseDown: false
        }));
    } else if (input.type === "mousemove") {
        if (action instanceof MouseDraggingAction) {
            newState = mouse_drag(state, input);
        }
    } else if (input.type === "mouseup") {
        if (action instanceof MouseDraggingAction) {
            var { intervalId, movedSinceMouseDown } = action;
            if (!movedSinceMouseDown) {
                onIntervalClick(intervalId, null);
            } else {
                unsetCursorToWholeDocument(window.document);
                onDragEnd(intervalId);
            }
            capturedMouseEvents.pause();
            newState = state.set("action", null);
        }
    } else if (input.type === "touchstart") {
        var { intervalId, side, initialCoords, timeBeforeDrag, touchId } = input;
        var longPressTimeoutId = setTimeout(function() {
            stream.onNext({
                type: "longpress-interval",
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
    } else if (input.type === "touchmove") {
        if (action instanceof TouchDraggingAction) {
            newState = touch_drag(state, input);
        }
    } else if (input.type === "touchend") {
        if (action instanceof TouchDraggingAction) {
            var { intervalId, touchId, movedSinceTouchStart } = action;
            if (touchId === input.touchId) {
                newState = state.set("action", null);
                if (!movedSinceTouchStart) {
                    onIntervalClick(intervalId, null); // TODO separete on touchEnd and onTap events
                }
            }
        }
    } else if (input.type === "longpress-interval") {
        if (action instanceof TouchDraggingAction &&
            action.touchId === input.touchId &&
            !state.action.movedSinceTouchStart &&
            state.onLongPress !== noop) {
            newState = state.set("action", null);
            onLongPress(action.intervalId);
        }
    } else {
        console.error("unexpected type of input; ignoring");
    }

    return newState;
}
