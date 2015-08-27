
// ACTIONS

export class FakeMouseEvent {
    constructor(target, obj) {
        this.target = target;
        this.obj = obj;
    }

    perform() {
        this.target.dispatchEvent(this.obj);
    }
}

export class TerminationSignal {
    constructor(terminationObserver) {
        this.terminationObserver = terminationObserver;
    }

    perform() {
        this.terminationObserver.onNext({ type: "unmountSignal" });
    }
}

// FUNCTIONS

export function replayEvents(eventSequence) {
    for (var event of eventSequence) {
        event.perform();
    }
}
