
var rx = require("rx");

describe("inputStream", () => {

    it("process all that is computable synchronously without interrupting the previous delta call", done => {
        var observer = new rx.Subject();
        var observable = observer.observeOn(rx.Scheduler.currentThread);

        var logged = [];
        var log = str => logged.push(str);

        var subscription = observable.subscribe(function exampleDelta(/*state, */ update) {
            if (update === 1) {
                log("update 1 start");
                observer.onNext(2);
                log("update 1 end");
            } else if (update === 2) {
                log("update 2 start");
                log("update 2 end");
            } else {
                log("update 3 start");
                update.toBeModifiedByHandler = true;
                log("update 3 end");
            }
        }, error => {
            throw error;
        }, end => {
            throw Error("Unexpected end of stream!");
        });

        setTimeout(() => {
            expect(logged).toEqual([
                "EVENT 1 TRIGGER",
                "update 1 start",
                "update 1 end",
                "update 2 start",
                "update 2 end",
                "EVENT 1 END",
                "EVENT 2 TRIGGER",
                "update 3 start",
                "update 3 end",
                "EVENT 2 END",
            ]);
            subscription.dispose();
            done();
        }, 500);

        // this setTimeout checks that the whole state machine runs synchronously
        setTimeout(() => {
            log(("EVENT 2 TRIGGER"));
            var eventObject = { toBeModifiedByHandler: false };
            observer.onNext(eventObject);
            expect(eventObject.toBeModifiedByHandler).toBeTruthy();
            log(("EVENT 2 END"));
        });

        log("EVENT 1 TRIGGER");
        observer.onNext(1);
        log(("EVENT 1 END"));
    });

});
