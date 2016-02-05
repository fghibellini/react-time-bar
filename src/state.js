
var Immutable = require("immutable");

import { noop } from './functions/utils';

export var TERMINATION_MSG = {};

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
    onIntervalDrag: null,
    onDragEnd: null,
    onLongPress: null,
    intervals: new Immutable.List([]),
    intervalContentGenerator: null,
    previewBoundsGenerator: null,
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
    onIntervalDrag: noop,
    onDragEnd: noop,
    onLongPress: noop,
    intervals: null,
    intervalContentGenerator: noop,
    previewBoundsGenerator: noop,
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
    movedSinceMouseDown: false        // a drag starts when the use moves the mouse after a mousedown otherwise it's a click
});

export var TouchDraggingAction = new Immutable.Record({
    intervalId: null,                 // the id of the dragged interval
    side: "both",                     // one of: "left", "right", "both"
    touchId: null,
    initialCoords: new Coordinates(), // the coordinates of the mousedown that initiated the drag
    timeBeforeDrag: null,             // the value of the property modified by the drag before the drag started
    movedSinceTouchStart: false       // a drag starts when the use moves the mouse after a mousedown otherwise it's a click
});

export function isDraggingAction(action) {
    return action instanceof MouseDraggingAction || action instanceof TouchDraggingAction;
}
