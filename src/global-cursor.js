
export function setCursorToWholeDocument(document, cursorName) {
    var head = document.head;
    var element = document.createElement("style");
    element.id = "drag-style";
    var text = document.createTextNode("* { cursor: " + cursorName + " !important; } ");
    element.appendChild(text);
    head.appendChild(element);
}

export function unsetCursorToWholeDocument(document) {
    var element = document.getElementById("drag-style");
    element.parentNode.removeChild(element);
}
