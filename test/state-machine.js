
var rx = require("rx");

import { TimeBar } from '../src/component';

describe("state machine", () => {

    it("once the state machine is terminated no more inputs shall be processed", done => {
        var observer = new rx.Subject();

        var registeredActions = [];

        var spyDelta = function(state, input, inputStream, environment, terminate) {
            registeredActions.push(input + " processing update");
            if (input === 2)
                terminate();
        };

        TimeBar.prototype.setupStateMachine(observer, spyDelta);

        observer.onNext(1);
        observer.onNext(2); // this is the termination signal
        observer.onNext(3);

        setTimeout(() => {
            expect(registeredActions).toEqual([
                "1 processing update",
                "2 processing update"
            ]);
            done();
        }, 50);
    });

});
