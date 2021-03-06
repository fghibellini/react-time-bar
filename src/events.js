
export const TERMINATE = "<TERMINATE>";
export const PROPERTY_CHANGE = "<PROPERTY-CHANGE>";

export const BAR_TOUCH_START = "<BAR-TOUCH-START-EVENT>";
export const BAR_TOUCH_END = "<BAR-TOUCH-END-EVENT>";
export const BAR_LONG_PRESS = "<BAR-LONG-PRESS-EVENT>";
export const BAR_SINGLE_TAP = "<BAR-SINGLE-TAP-EVENT>";

export const BAR_MOUSE_MOVE = "<BAR-MOUSE-MOVE>";
export const BAR_MOUSE_LEAVE = "<BAR-MOUSE-LEAVE>";

export const INTERVAL_MOUSE_DOWN = "<INTERVAL-MOUSE-DOWN>";
export const GLOBAL_MOUSE_MOVE = "<GLOBAL-MOUSE-MOVE>";
export const GLOBAL_MOUSE_UP = "<GLOBAL-MOUSE-UP>";

export const INTERVAL_TOUCH_START = "<INTERVAL-TOUCH-START>";
export const INTERVAL_TOUCH_MOVE = "<INTERVAL-TOUCH-MOVE>";
export const INTERVAL_TOUCH_END = "<INTERVAL-TOUCH-END>";
export const INTERVAL_LONG_PRESS = "<INTERVAL-LONG-PRESS>";

export function isMouseEvent(e) {
    return !!~[
        BAR_MOUSE_MOVE,
        BAR_MOUSE_LEAVE,
        INTERVAL_MOUSE_DOWN,
        GLOBAL_MOUSE_MOVE,
        GLOBAL_MOUSE_UP
    ].indexOf(e);
}
