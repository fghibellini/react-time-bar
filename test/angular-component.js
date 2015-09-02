
var rx = require("rx");
var $ = window.jQuery = require("jquery"); // publish jQuery so that angular can pick it
var angular = require("angular");
var angularMock = require('angular-mocks/ngMock');

var mockModule = window.module;
var mockInject = window.inject;

require("../src/angular-directive");

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
