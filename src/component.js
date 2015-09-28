
require("!style!css!less!./styles.less");

var rx = require("rx");
var React = require("react");

import { mergeInputs } from './functions/utils';
import { TimeBarState, PreviewAction, intervalsToImmutable, propsToImmutable, TERMINATION_MSG  } from './state';
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
            onIntervalNew: React.PropTypes.func
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
                onIntervalNew: noop
            };
        },
        getAllInputs: function() {
            var inputSubject = new rx.Subject();
            this.inputObserver = inputSubject;
            return mergeInputs([inputSubject, capturedMouseEvents]).observeOn(rx.Scheduler.currentThread);
        },
        setupStateMachine: function(allInputs, deltaFunction) {
            var SM_Subscription = allInputs.subscribe(update => {
                try {
                    /* ONLY THIS FUNCTION IS ALLOWED TO CHANGE THE STATE DIRECTLY */
                    var { state, inputObserver } = this;

                    if (this.__deltaRunnging) { console.error(Error(NESTED_DELTAS_ERROR)); }
                    this.__deltaRunnging = true;
                    var newState = deltaFunction(state, update, inputObserver, environment, SM_Subscription.dispose.bind(SM_Subscription));
                    this.__deltaRunnging = false;

                    if (newState !== state) {
                        this.replaceState(newState);
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

            return new TimeBarState({
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
                    max, width, intervals,
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

                var leftHandleDragStart = mouseDownHandlerGen("left", interval.from);
                var rightHandleDragStart = mouseDownHandlerGen("right", interval.to);
                var intervalDragStart = mouseDownHandlerGen("whole", interval.from);

                return (<div className={["interval", interval.className].join(" ")}
                             key={interval.id}
                             onMouseDown={intervalDragStart}
                             style={{ left: start, width: end - start }}>
                    <div className="interval-handle interval-handle-left"
                         onMouseDown={leftHandleDragStart} />
                    <div className="interval-handle interval-handle-right"
                         onMouseDown={rightHandleDragStart} />
                    {intervalContentGenerator(interval)}
                </div>);
            });

            // THE PREVIEW OF A NEW INERVAL

            var intervalPreview = !(action && action instanceof PreviewAction) ? null : (() => {
                var x = action.x;
                var startTime = max * x / width;
                var bounds = previewBoundsGenerator(startTime, max, intervals.toJS());

                var previewClick = e => {
                    e.stopPropagation();
                    onIntervalNew(bounds);
                };

                if (bounds === null) {
                    return null;
                } else {
                    var start = width * bounds.from / max;
                    var end = width * bounds.to / max;
                    return (<div className="new-interval"
                                 style={{ left: start, width: end - start }}
                                 onClick={previewClick}>+</div>);
                }
            })();

            // THE TIME BAR ITSELF

            var barMouseMove = e => {
                var barElement = React.findDOMNode(this);
                if (e.target === barElement || e.target.className === "new-interval") {
                    var boundingRect = barElement.getBoundingClientRect();
                    var x = e.pageX - boundingRect.left;

                    inputObserver.onNext({
                        type: "bar-mousemove",
                        x: x
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

            return (<div className="time-bar"
                        style={{ width: width }}
                        onMouseMove={barMouseMove}
                        onMouseLeave={barMouseLeave}>
                {intervalPreview}
                {mappedIntervals}
            </div>);
        }
    });
};

export var TimeBar = (window && window.document) ? getTimeBarComponent({ capturedMouseEvents: captureMouseEventsOnDomNode(window.document) }) : null;
