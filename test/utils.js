
export function getNewDocument() {
    var newWindow = window.open();

    return {
        document: newWindow.document,
        dispose: () => newWindow.close()
    };
}
