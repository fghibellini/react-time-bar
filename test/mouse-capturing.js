
var rx = require("rx");
var $ = require("jquery");
var React = require("react");

import { getNewDocument, triggerMouseMove } from './utils';
import { captureMouseEventsOnDomNode } from '../src/component';

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
     *
     * To pass this test you can't have your cursor on the upper-left part of the window,
     * otherwise the opening tab triggers a few mousemoves.
     * TODO use a virtual window (phantomjs, ...)
     */
    it("first test that the mouse events are captured by all the handlers", done => {
        /* an implementation that doesn't use event capturing and doesn't stop bubbling */
        function captureMouseEventsOnDomNode(document) {
            var mouseUps   = rx.DOM.fromEvent(document, 'mouseup');
            var mouseMoves = rx.DOM.fromEvent(document, 'mousemove');
            return rx.Observable.merge([mouseUps, mouseMoves]);
        }

        var buttonMouseMoveHandler = jasmine.createSpy('buttonMouseMoveHandler');
        var domMouseMoveHandler = jasmine.createSpy('domMouseMoveHandler');

        // register first handler
        button.on("mousemove", buttonMouseMoveHandler);

        // register second handler
        var disposable = captureMouseEventsOnDomNode(dom.get(0)).subscribe(domMouseMoveHandler);

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
        var disposable = captureMouseEventsOnDomNode(dom.get(0)).subscribe(domMouseMoveHandler);
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
        var disposable = captureMouseEventsOnDomNode(dom.get(0)).subscribe(domMouseMoveHandler);
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
