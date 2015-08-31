"use strict";

var $ = window.jQuery = require("jquery"); // publish jQuery so that angular can pick it
var rx = require("rx");
var angular = require("angular");
var angularMock = require('angular-mocks/ngMock');

require("../src/angular-directive");

import { mergeInputs } from '../src/functions/utils';
import { TimeBar } from '../src/component';
import { getNewDocument } from './utils';

var mockModule = window.module;
var mockInject = window.inject;

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

describe("state machine", () => {

    it("once the state machine is terminated no more inputs shall be processed", (done) => {
        var observer = new rx.Subject();

        var registeredActions = [];

        var spyDelta = function(state, input, inputStream, terminate) {
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

describe("angular component", () => {

    var document, dispose;

    //beforeEach(() => {
    //    // don't shit where you eat
    //    ({ document, dispose } = getNewDocument());
    //});

    //afterEach(() => {
    //    if (document) {
    //        dispose();
    //        document = null;
    //        dispose = null;
    //    }
    //});

    function genTimeBarSet(iterator) {
        var start = 8;
        var duration = 2;
        var maxDistanceFromStart = 18 - duration - start;
        var nthStart = n => start + ((iterator + n) % maxDistanceFromStart) + ":00";
        var nthEnd   = n => start + ((iterator + n) % maxDistanceFromStart) + duration + ":00";

        return [0,1,2,3].map(n => {
            return { ints: [ { id: 0, from: nthStart(n), to: nthEnd(n) } ] };
        });
    }

    it("generate and destroy a lot of components", (done) => {
        var document = window.document;

        mockModule('react-timebar', function($provide) {
            console.log("got provide!");
            $provide.value("$document", { value: "ahoj" });
        });

        mockInject(function($compile, $rootScope) {
            var scope = $rootScope.$new();
            var dom = $compile('<div id="test1-dom"><react-time-bar ng-repeat="t in timebars" intervals="t.ints" /></div>')(scope);

            var iterations = 5;

            rx.Observable
                .interval(200)
                .timeInterval()
                .take(iterations + 1)
                .subscribe(update => {
                    scope.$apply(() => {
                        console.log("update!");
                        if (update.value < iterations) {
                            var i = update.value;
                            scope.timebars = genTimeBarSet(i);
                        } else {
                            // TODO check a criteria that ckecks that even
                            var elements = dom.find(".time-bar");
                            expect(elements.size()).toEqual(4);
                            done();
                        }
                    });
                });
        });
    });

});
