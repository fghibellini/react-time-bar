
export function getNewDocument() {
    var newWindow = window.open();

    window.focus();

    return {
        document: newWindow.document,
        dispose: () => newWindow.close()
    };
}
