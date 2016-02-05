
require("!style!css!less!./styles.less");

var rx = require("rx");
var React = require("react");

import { mergeInputs } from './functions/utils';
import { TimeBarState, PreviewAction, TouchDraggingAction, intervalsToImmutable, propsToImmutable, TERMINATION_MSG  } from './state';
import { deltaFunction } from './delta-function';
import { captureMouseEventsOnDomNode } from './mouse-event-capturing';
import { defaultPreviewBoundsGenerator } from './functions/common';

var noop = rx.helpers.noop;

var NESTED_DELTAS_ERROR = "The delta function is not allowed to synchrously trigger another state transition! This is a bug in the time-bar component.";
var NO_CAPTURED_EVENTS_STREAM_ERROR = "The TimeBar component requires a pausable stream of mouse events!";
var NO_ENVIRONMENT_ERROR = "The TimeBar component requires and environment object!";

export function getTimeBarComponent(environmentArgs) {

    if (!environmentArgs) {
        throw Error(NO_ENVIRONMENT_ERROR);
    }
    if (!environmentArgs.capturedMouseEvents) {
        throw Error(NO_CAPTURED_EVENTS_STREAM_ERROR);
    }

    var capturedMouseEvents = environmentArgs.capturedMouseEvents.pausable();
    capturedMouseEvents.pause();

    var environment = {
        capturedMouseEvents: capturedMouseEvents
    };

    return React.createClass({
        displayName: "TimeBar",
        propTypes: {
            max: React.PropTypes.number,
            width: React.PropTypes.number,
            onStartChange: React.PropTypes.func,
            onEndChange: React.PropTypes.func,
            onIntervalClick: React.PropTypes.func,
            onIntervalDrag: React.PropTypes.func,
            onDragEnd: React.PropTypes.func,
            intervals: React.PropTypes.arrayOf(React.PropTypes.shape({
                id: React.PropTypes.oneOfType([
                    React.PropTypes.number,
                    React.PropTypes.string
                ]),
                from: React.PropTypes.number,
                to: React.PropTypes.number,
                className: React.PropTypes.string
            })),
            intervalContentGenerator: React.PropTypes.func,
            previewBoundsGenerator: React.PropTypes.func,
            onIntervalNew: React.PropTypes.func,
            direction: React.PropTypes.string
        },
        getDefaultProps: function() {
            return {
                max: 1440,
                width: 800,
                onStartChange: noop,
                onEndChange: noop,
                onIntervalClick: noop,
                onIntervalDrag: noop,
                onDragEnd: noop,
                intervals: [],
                intervalContentGenerator: () => null,
                previewBoundsGenerator: defaultPreviewBoundsGenerator,
                onIntervalNew: noop,
                direction: "horizontal"
            };
        },
        getAllInputs: function() {
            var inputSubject = new rx.Subject();
            this.inputObserver = inputSubject;
            return mergeInputs([inputSubject, capturedMouseEvents]).observeOn(rx.Scheduler.currentThread);
        },
        setupStateMachine: function(allInputs, deltaFunction) {
            function formatState(state) {
                if (state.action) {
                    var action = state.action;
                    if (action instanceof TouchDraggingAction) {
                        return state.action.movedSinceTouchStart;
                    } else {
                        return "<action not touch-drag>";
                    }
                } else {
                    return "<no action>";
                }
            }
            var SM_Subscription = allInputs.subscribe(update => {
                try {
                    /* ONLY THIS FUNCTION IS ALLOWED TO CHANGE THE STATE DIRECTLY */
                    var { my_state: state, inputObserver } = this;

                    console.log("TRANSITION:");
                    console.log("-----------");
                    console.log("update: " + JSON.stringify(update));
                    console.log("from: " + formatState(state));

                    if (this.__deltaRunnging) { console.error(Error(NESTED_DELTAS_ERROR)); }
                    this.__deltaRunnging = true;
                    var newState = deltaFunction(state, update, inputObserver, environment, SM_Subscription.dispose.bind(SM_Subscription));
                    this.__deltaRunnging = false;

                    if (newState !== state) {
                        this.my_state = newState;
                        this.replaceState(newState);
                        console.log("to: " + formatState(newState));
                    } else {
                        console.log("[not replacing state]");
                    }
                } catch (e) {
                    // Prevent unexpected errors to freeze the time bar.
                    console.error(e);
                }
            }, error => {
                // One of the input streams failed.
                console.error(error);
            });
        },
        getInitialState: function() {
            var initialProps = propsToImmutable(this.props);

            var allInputs = this.getAllInputs();
            this.setupStateMachine(allInputs, deltaFunction);

            return this.my_state = new TimeBarState({
                action: null,
                ...initialProps.toObject()
            });
        },
        componentWillReceiveProps: function(newProps) {
            var { inputObserver } = this;
            var newPropUpdate = {
                type: "propchange",
                newProps: propsToImmutable(newProps)
            };
            inputObserver.onNext(newPropUpdate);
        },
        componentWillUnmount: function() {
            var { inputObserver } = this;
            inputObserver.onNext(TERMINATION_MSG);
        },
        render: function() {
            var {
                state: {
                    action,
                    max, width, intervals, direction,
                    intervalContentGenerator, previewBoundsGenerator,
                    onIntervalNew
                },
                inputObserver
            } = this;

            // THE DISPLAYED INTERVALS

            var mappedIntervals = intervals.map((interval, intIndex) => {
                var start = width * interval.from / max;
                var end = width * interval.to / max;

                var mouseDownHandlerGen = (side, timeBeforeDrag) => e => {
                    inputObserver.onNext({
                        type: "mousedown",
                        intervalId: interval.id,
                        side: side,
                        initialCoords: { x: e.clientX, y: e.clientY },
                        timeBeforeDrag: timeBeforeDrag
                    });
                    e.preventDefault();
                    e.stopPropagation();
                };

                var touchStartHandlerGen = (side, timeBeforeDrag) => e => {
                    console.log("touch");
                    var touch = e.changedTouches[0];
                    inputObserver.onNext({
                        type: "touchstart",
                        intervalId: interval.id,
                        side: side,
                        touchId: touch.identifier,
                        initialCoords: { x: touch.clientX, y: touch.clientY },
                        timeBeforeDrag: timeBeforeDrag
                    });
                    e.preventDefault();
                    e.stopPropagation();
                };

                var touchMove = e => {
                    var touch = e.changedTouches[0];
                    inputObserver.onNext({
                        type: "touchmove",
                        touchId: touch.identifier,
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                    e.preventDefault();
                    e.stopPropagation();
                };

                var touchEnd = e => {
                    var touch = e.changedTouches[0];
                    inputObserver.onNext({
                        type: "touchend",
                        touchId: touch.identifier,
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                    e.preventDefault();
                    e.stopPropagation();
                };

                var leftHandleDragStart = mouseDownHandlerGen("left", interval.from);
                var rightHandleDragStart = mouseDownHandlerGen("right", interval.to);
                var intervalDragStart = mouseDownHandlerGen("whole", interval.from);

                var leftHandleTouchDragStart = touchStartHandlerGen("left", interval.from);
                var rightHandleTouchDragStart = touchStartHandlerGen("right", interval.to);
                var intervalTouchDragStart = touchStartHandlerGen("whole", interval.from);

                var style = (direction === "horizontal") ? { left: start, width: end - start } : { top: start, height: end - start };

                return (<div className={["interval", interval.className].join(" ")}
                             key={interval.id}
                             onMouseDown={intervalDragStart}
                             onTouchStart={intervalTouchDragStart}
                             onTouchEnd={touchEnd}
                             onTouchMove={touchMove}
                             style={style}>
                    <div className="interval-handle interval-handle-left"
                         onMouseDown={leftHandleDragStart}
                         onTouchStart={leftHandleDragStart} />
                    <div className="interval-handle interval-handle-right"
                         onMouseDown={rightHandleDragStart}
                         onTouchStart={rightHandleDragStart} />
                    {intervalContentGenerator(interval)}
                </div>);
            });

            // THE PREVIEW OF A NEW INERVAL

            var intervalPreview = !(action && action instanceof PreviewAction) ? null : (() => {
                var offset = action.offset;
                var startTime = max * offset / width;
                var bounds = previewBoundsGenerator(startTime, max, intervals.toJS());

                var previewClick = e => {
                    e.stopPropagation();
                    onIntervalNew(bounds);
                };

                if (bounds === null) {
                    return null;
                } else {
                    console.log(bounds);
                    var start = width * bounds.from / max;
                    var end = width * bounds.to / max;
                    var style = (direction === "horizontal") ? { left: start, width: end - start } : { top: start, height: end - start };
                    return (<div className="new-interval"
                                 style={style}
                                 onClick={previewClick}>+</div>);
                }
            })();

            // THE TIME BAR ITSELF

            var barMouseMove = e => {
                var barElement = React.findDOMNode(this);
                if (e.target === barElement || e.target.className === "new-interval") {
                    var boundingRect = barElement.getBoundingClientRect();
                    var [page, bounding] = direction === 'horizontal' ? [e.pageX, boundingRect.left + window.scrollX] : [e.pageY, boundingRect.top + window.scrollY];
                    var offset = page - bounding;

                    inputObserver.onNext({
                        type: "bar-mousemove",
                        offset: offset
                    });
                } else {
                    inputObserver.onNext({
                        type: "bar-mouseleave"
                    });
                }
            };

            var barMouseLeave = e => {
                inputObserver.onNext({
                    type: "bar-mouseleave"
                });
            };

            return (<div className={["time-bar", direction].join(" ")}
                        style={(direction === "horizontal") ? { width: width } : { height: width }}
                        onMouseMove={barMouseMove}
                        onMouseLeave={barMouseLeave}>
                {intervalPreview}
                {mappedIntervals}
            </div>);
        }
    });
};

export var TimeBar = (window && window.document) ? getTimeBarComponent({ capturedMouseEvents: captureMouseEventsOnDomNode(window.document) }) : null;
