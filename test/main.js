"use strict";

var rx = require("rx");

import { mergeInputs } from '../src/functions/utils';

describe("inputStream", () => {

    /**
     * Always only one update is being processed,
     * otherwise new δ calls could run
     * with the same state their source used.
     * (The state is set on return.)
     */
    it("new inputs don't interrupt the ones that are currently being processed", (done) => {
        var observer = new rx.Subject();
        var observable = mergeInputs([observer]);

        var registeredActions = [];

        var check = () => {
            expect(registeredActions).toEqual([
                "1 processing update",
                "1 computing new state",
                "2 processing update",
                "2 computing new state"
            ]);
            done();
        };

        var subscription = observable.subscribe(function exampleDelta(/*state, */ update) {
            if (update === 1) {
                // STEP 1: The first delta-fn call processes the update information.
                registeredActions.push(update + " processing update");
                // STEP 2: The first delta-fn call produces a new update but the new state was still not computed.
                if (update === 1) {
                    observer.onNext(2);
                }
                // STEP 3: The first delta call produces a new state, that is passed to the next delta-fn call.
                registeredActions.push(update + " computing new state");
            } else {
                registeredActions.push(update + " processing update");
                registeredActions.push(update + " computing new state");
            }

            if (registeredActions.length === 4) {
                subscription.dispose();
                check();
            }
        }, error => {
            throw error;
        }, end => {
            throw Error("Unexpected end of stream!");
        });

        observer.onNext(1);
    });

});
