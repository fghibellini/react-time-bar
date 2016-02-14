
var Immutable = require("immutable");

import { noop } from './functions/utils';

export var Interval = new Immutable.Record({
    id: null,
    from: null,
    to: null,
    className: ""
});

export var Coordinates = new Immutable.Record({
    x: 0,
    y: 0
});

export function intervalsToImmutable(intervalsArray) {
    return Immutable.fromJS(intervalsArray, function(key, value) {
        if (key === "") {
            return new Immutable.List(value);
        } else {
            return new Interval(value);
        }
    });
}

export var Props = new Immutable.Record({
    max: null,
    width: null,
    onStartChange: null,
    onEndChange: null,
    onIntervalClick: null,
    onIntervalTap: null,
    onIntervalLongPress: null,
    onIntervalDrag: null,
    onDragEnd: null,
    onLongPress: null,
    onDoubleLongPress: null,
    onTap: null,
    longPressInterval: 300,
    mouseMoveRadius: 10,
    touchMoveRadius: 10,
    intervals: new Immutable.List([]),
    intervalContentGenerator: null,
    previewBoundsGenerator: null,
    onDoubleTap: null,
    onIntervalNew: null,
    direction: 'horizontal'
});

export function propsToImmutable(propsObject) {
    var { intervals, ...otherProps } = propsObject;
    return new Props({
        intervals: intervalsToImmutable(intervals),
        ...otherProps
    });
}

export var TimeBarState = new Immutable.Record({
    action: null,
    // the following are digested props
    max: 1440,
    width: 400,
    direction: 'horizontal',
    onStartChange: noop,
    onEndChange: noop,
    onIntervalClick: noop,
    onIntervalTap: noop,
    onIntervalLongPress: noop,
    onIntervalDrag: noop,
    onDragEnd: noop,
    onLongPress: noop,
    onDoubleLongPress: noop,
    onTap: noop,
    longPressInterval: 300,
    mouseMoveRadius: 2,
    touchMoveRadius: 2,
    intervals: null,
    intervalContentGenerator: noop,
    previewBoundsGenerator: noop,
    onDoubleTap: noop,
    onIntervalNew: noop
});

export var PreviewAction = new Immutable.Record({
    offset: null
});

export var MouseDraggingAction = new Immutable.Record({
    intervalId: null,                 // the id of the dragged interval
    side: "both",                     // one of: "left", "right", "both"
    initialCoords: new Coordinates(), // the coordinates of the mousedown that initiated the drag
    timeBeforeDrag: null,             // the value of the property modified by the drag before the drag started
    movedSinceMouseDown: false,       // a drag starts when the use moves the mouse after a mousedown otherwise it's a click
    capturedMouseEvents: null
});

export var TouchDraggingAction = new Immutable.Record({
    intervalId: null,                 // the id of the dragged interval
    side: "both",                     // one of: "left", "right", "both"
    touchId: null,
    longPressTimeoutId: null,         // return value of setTimeout
    t0: null,                         // date object with time of touchstart
    initialCoords: new Coordinates(), // the coordinates of the mousedown that initiated the drag
    timeBeforeDrag: null,             // the value of the property modified by the drag before the drag started
    movedSinceTouchStart: false       // a drag starts when the use moves the mouse after a mousedown otherwise it's a click
});

export function isDraggingAction(action) {
    return action instanceof MouseDraggingAction || action instanceof TouchDraggingAction;
}

// BAR TOUCH EVENT HANDLING

export var FirstPressed = new Immutable.Record({
    longPressTimeoutId: null,
    offset: null
});

export var FirstReleased = new Immutable.Record({
    singleTapTimeoutId: null
});

export var SecondPressed = new Immutable.Record({
    longPressTimeoutId: null
});

