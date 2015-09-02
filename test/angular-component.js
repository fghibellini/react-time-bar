
var rx = require("rx");
var $ = window.jQuery = require("jquery"); // publish jQuery so that angular can pick it
var angular = require("angular");
var angularMock = require('angular-mocks/ngMock');

var mockModule = window.module;
var mockInject = window.inject;

require("../src/angular-directive");

import { TimeBar } from '../src/component';
import { genTimeBarSet } from './timebar-utils';

describe("angular component", () => {

    it("generate and destroy a lot of components", done => {
        spyOn(TimeBar.prototype, "componentWillUnmount");

        mockModule('react-timebar');

        mockInject(function($compile, $rootScope) {
            var scope = $rootScope.$new();

            var dom = $compile(`<div id="test1-dom">
                <react-time-bar ng-repeat="t in timebars" intervals="t.ints" /></react-time-bar>
            </div>`)(scope);

            var iterations = 5;
            var barCount = 4;

            // TODO change this to not contain pause times
            rx.Observable
                .interval(200)
                .timeInterval()
                .take(iterations + 1)
                .subscribe(update => {
                    if (update.value < iterations) {
                        scope.$apply(() => {
                            scope.timebars = genTimeBarSet("8:00", "18:00", 2 * 60, barCount, update.value);
                        });
                    } else {
                        expect(dom.find(".time-bar").size()).toEqual(4);
                        expect(TimeBar.prototype.componentWillUnmount.calls.count()).toEqual((iterations - 1) * barCount);

                        dom.remove();
                        scope.$destroy();

                        setTimeout(() => {
                            expect(TimeBar.prototype.componentWillUnmount.calls.count()).toEqual(iterations * barCount);
                            done();
                        });
                    }
                });
        });
    });

});
