"use strict";

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

var $ = window.jQuery = require("jquery"); // publish jQuery so that angular can pick it
var rx = require("rx");
var React = require("react");
var angular = require("angular");
var angularMock = require('angular-mocks/ngMock');

require("../src/angular-directive");

import { mergeInputs } from '../src/functions/utils';
import { getTimeBarComponent, inputStreamsFromDocument } from '../src/component';
import { getNewDocument, triggerMouseMove } from './utils';

var mockModule = window.module;
var mockInject = window.inject;

describe("inputStream", () => {

    /**
     * Always only one update is being processed,
     * otherwise new δ calls could run
     * with the same state their source used.
     * (The state is set on return.)
     */
    it("new inputs don't interrupt the ones that are currently being processed", done => {
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

    it("once the state machine is terminated no more inputs shall be processed", done => {
        var observer = new rx.Subject();

        var registeredActions = [];

        var spyDelta = function(state, input, inputStream, terminate) {
            registeredActions.push(input + " processing update");
            if (input === 2)
                terminate();
        };

        getTimeBarComponent().prototype.setupStateMachine(observer, spyDelta);

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

    it("generate and destroy a lot of components", done => {
        var mouseEvents = new rx.Subject();

        mockModule('react-timebar', function($provide) {
            $provide.value('reactTimeBar.Inputs', mouseEvents);
        });

        mockInject(function($compile, $rootScope) {
            var scope = $rootScope.$new();
            var dom = $compile('<div id="test1-dom"><react-time-bar ng-repeat="t in timebars" intervals="t.ints" /></div>')(scope);
            var iterations = 5;

            // TODO change this to not contain pause times
            rx.Observable
                .interval(200)
                .timeInterval()
                .take(iterations + 1)
                .subscribe(update => {
                    scope.$apply(() => {
                        if (update.value < iterations) {
                            var i = update.value;
                            scope.timebars = genTimeBarSet(i);
                        } else {
                            var elements = dom.find(".time-bar");
                            expect(elements.size()).toEqual(4);
                            expect(mouseEvents.observers.length).toEqual(4);

                            dom.remove();
                            scope.$destroy();

                            setTimeout(() => {
                                expect(mouseEvents.observers.length).toEqual(0);
                                done();
                            });
                        }
                    });
                });
        });
    });

});

describe("mouse inputs from document", () => {

    var document, dispose, dom, button;

    beforeEach(() => {
        ({ document, dispose } = getNewDocument());
        dom = $(`<div id="mouse-tests" style="width: 400px; height: 400px; padding: 0;">
            <button id="triggering-element" style="width: 80px; height: 20px;">move over me</button>
        </div>`);
        button = dom.find("button");
        dom.appendTo($(document).find("body"));
    });

    afterEach(() => {
        dom.remove();
        dom = button = null;

        dispose();
        document = dispose = null;
    });

    /**
     * This test checks that the next one doesn't pass because the rx-dom streams
     * don't react to the artificial mouse moves.
     */
    it("first test that the mouse events are captured by all the handlers", done => {
        /* an implementation that doesn't use event capturing and doesn't stop bubbling */
        function inputStreamsFromDocument(document) {
            var mouseUps   = rx.DOM.fromEvent(document, 'mouseup');
            var mouseMoves = rx.DOM.fromEvent(document, 'mousemove');
            return rx.Observable.merge([mouseUps, mouseMoves]);
            //.do(x => {
            //    console.log("from observable!");
            //    console.log(x);
            //});
        }

        var buttonMouseMoveHandler = jasmine.createSpy('buttonMouseMoveHandler');
        var domMouseMoveHandler = jasmine.createSpy('domMouseMoveHandler');

        // register first handler
        button.on("mousemove", buttonMouseMoveHandler);

        // register second handler
        var disposable = inputStreamsFromDocument(dom.get(0)).subscribe(domMouseMoveHandler);

        // trigger the event
        triggerMouseMove(button.get(0));

        setTimeout(() => {
            expect(buttonMouseMoveHandler.calls.count()).toEqual(1);
            expect(domMouseMoveHandler.calls.count()).toEqual(1);

            disposable.dispose();
            done();
        }, 100);
    });

    it("the element should not be notified about the mousemove while dragging", done => {
        var buttonMouseMoveHandler = jasmine.createSpy('buttonMouseMoveHandler');
        var domMouseMoveHandler = jasmine.createSpy('domMouseMoveHandler');

        button.on("mousemove", buttonMouseMoveHandler);

        // before a drag-start all elements should register events on themselves as usual
        triggerMouseMove(button.get(0));

        // once the user starts dragging no element should be notified about any mousemoves/mouseups
        var disposable = inputStreamsFromDocument(dom.get(0)).subscribe(domMouseMoveHandler);
        triggerMouseMove(button.get(0));
        disposable.dispose();

        // one the use stops dragging everything should return to normal
        triggerMouseMove(button.get(0));

        setTimeout(() => {
            expect(buttonMouseMoveHandler.calls.count()).toEqual(2);
            expect(domMouseMoveHandler.calls.count()).toEqual(1);

            done();
        }, 100);
    });

    /**
     * Since react uses event delegation itself,
     * we have to check we are called first.
     */
    it("the element should not be notified about the mousemove while dragging - (react collision?)", done => {
        var domMouseMoveHandler = jasmine.createSpy('domMouseMoveHandler');
        var buttonMouseMoveHandler = jasmine.createSpy('buttonMouseMoveHandler');

        var reactRoot = $("<div>").appendTo(dom);
        var reactComponent = React.render(<div onMouseMove={buttonMouseMoveHandler}></div>, reactRoot.get(0));
        var buttonDomNode = React.findDOMNode(reactComponent);

        // before a drag-start all elements should register events on themselves as usual
        triggerMouseMove(buttonDomNode);

        // once the user starts dragging no element should be notified about any mousemoves/mouseups
        var disposable = inputStreamsFromDocument(dom.get(0)).subscribe(domMouseMoveHandler);
        triggerMouseMove(buttonDomNode);
        disposable.dispose();

        // one the use stops dragging everything should return to normal
        triggerMouseMove(buttonDomNode);

        setTimeout(() => {
            expect(buttonMouseMoveHandler.calls.count()).toEqual(2);
            expect(domMouseMoveHandler.calls.count()).toEqual(1);

            done();
        }, 100);
    });

});
