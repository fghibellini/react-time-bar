
export function getNewDocument() {
    var newWindow = window.open();

    window.focus();

    return {
        document: newWindow.document,
        dispose: () => newWindow.close()
    };
}

/**
 * - Taken from https://gist.github.com/callmephilip/3517765 .
 * - Seems to be ok that we're throwing the event created in
 *   one window in another window.
 */
export function triggerMouseMove(target) {
    var document = window.document;
    var mouseMoveEvent = document.createEvent("MouseEvents");
    mouseMoveEvent.initMouseEvent(
        "mousemove", //event type : click, mousedown, mouseup, mouseover, mousemove, mouseout.
        true, //canBubble
        false, //cancelable
        window, //event's AbstractView : should be window
        1, // detail : Event's mouse click count
        50, // screenX
        50, // screenY
        50, // clientX
        50, // clientY
        false, // ctrlKey
        false, // altKey
        false, // shiftKey
        false, // metaKey
        0, // button : 0 = click, 1 = middle button, 2 = right button
        null // relatedTarget : Only used with some event types (e.g. mouseover and mouseout). In other cases, pass null.
    );
    target.dispatchEvent(mouseMoveEvent);
}
