"use strict";

import { genStreamStructure } from '../src/event-stream';
import { FakeMouseEvent, TerminationSignal, replayEvents } from './event-simulation';

var MouseEvent = window.MouseEvent;

describe("genStreamStructure", () => {

    /**
     * TODO
     *
     * Don't use the browser's document object or completely
     * remove the mouse events from the tests of the streams.
     *
     * In theory the users mouse events are also registered now.
     */

    it("terminated by termination signal", (done) => {
        var document = window.document;
        var structure = genStreamStructure(document);

        var registered = [];

        structure.observable.subscribe(update => {
            registered.push(update);
        }, error => {
            done(error);
        }, end => {
            var ids = registered.map(e => e.clientX);
            expect(ids).toEqual([2,3,4,5,undefined]);
            done();
        });

        replayEvents([
            new FakeMouseEvent(document, new MouseEvent("mousemove", { clientX: 1 })), // 0
            new FakeMouseEvent(document, new MouseEvent("mousedown", { clientX: 2 })), // 1
            new FakeMouseEvent(document, new MouseEvent("mousemove", { clientX: 3 })), // 2
            new FakeMouseEvent(document, new MouseEvent("mousemove", { clientX: 4 })), // 3
            new FakeMouseEvent(document, new MouseEvent("mouseup",   { clientX: 5 })), // 4
            new FakeMouseEvent(document, new MouseEvent("mousemove", { clientX: 6 })), // 4
            new TerminationSignal(structure.terminationObserver)                       // 5
        ]);
    });

    it("terminated by mouseup", (done) => {
        var document = window.document;
        var structure = genStreamStructure(document);

        var registered = [];

        var disposable = structure.observable.subscribe(update => {
            registered.push(update);
        }, error => {
            done(error);
        }, end => {
            var ids = registered.map(e => e.clientX);
            expect(ids).toEqual([2,3,4,5,undefined]);
            done();
        });

        replayEvents([
            new FakeMouseEvent(document, new MouseEvent("mousemove", { clientX: 1 })), // 0
            new FakeMouseEvent(document, new MouseEvent("mousedown", { clientX: 2 })), // 1
            new FakeMouseEvent(document, new MouseEvent("mousemove", { clientX: 3 })), // 2
            new FakeMouseEvent(document, new MouseEvent("mousemove", { clientX: 4 })), // 3
            new FakeMouseEvent(document, new MouseEvent("mouseup",   { clientX: 5 })), // 4
            new FakeMouseEvent(document, new MouseEvent("mousemove", { clientX: 6 })), // 4
            new FakeMouseEvent(document, new MouseEvent("mouseup",   { clientX: 7 })), // 4
            new TerminationSignal(structure.terminationObserver)                       // 5
        ]);
    });

});
