
require("!style!css!less!./styles.less");

var rx = require("rx");
var React = require("react");

import { mergeInputs, noop } from './functions/utils';
import { TimeBarState, PreviewAction, TouchDraggingAction, intervalsToImmutable, propsToImmutable } from './state';
import { deltaFunction, stateExitClearTimeoutHooks } from './delta-function';
import { captureMouseEventsOnDomNode } from './mouse-event-capturing';
import { defaultPreviewBoundsGenerator } from './functions/common';
import { BAR_TOUCH_START, BAR_TOUCH_END, BAR_LONG_PRESS, BAR_SINGLE_TAP, BAR_MOUSE_MOVE, BAR_MOUSE_LEAVE, INTERVAL_MOUSE_DOWN, GLOBAL_MOUSE_MOVE, GLOBAL_MOUSE_UP, INTERVAL_TOUCH_START, INTERVAL_TOUCH_MOVE, INTERVAL_TOUCH_END, INTERVAL_LONG_PRESS, PROPERTY_CHANGE, TERMINATE } from './events';

var NESTED_DELTAS_ERROR = "The delta function is not allowed to synchrously trigger another state transition! This is a bug in the time-bar component.";
var NO_CAPTURED_EVENTS_STREAM_ERROR = "The TimeBar component requires a pausable stream of mouse events!";
var NO_ENVIRONMENT_ERROR = "The TimeBar component requires and environment object!";

export const CREATE_INTERVAL = function() { /* token function */ };

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
        statics: {
            CREATE_INTERVAL: CREATE_INTERVAL
        },
        propTypes: {
            max: React.PropTypes.number,
            width: React.PropTypes.number,
            onStartChange: React.PropTypes.func,
            onEndChange: React.PropTypes.func,
            onIntervalClick: React.PropTypes.func,
            onIntervalTap: React.PropTypes.func,
            onIntervalDrag: React.PropTypes.func,
            onDragEnd: React.PropTypes.func,
            onLongPress: React.PropTypes.func,
            onDoubleLongPress: React.PropTypes.func,
            onTap: React.PropTypes.func,
            longPressInterval: React.PropTypes.number,
            mouseMoveRadius: React.PropTypes.number,
            touchMoveRadius: React.PropTypes.number,
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
            onDoubleTap: React.PropTypes.func,
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
                onIntervalTap: noop,
                onIntervalDrag: noop,
                onDragEnd: noop,
                onLongPress: noop,
                onDoubleLongPress: noop,
                onTap: noop,
                longPressInterval: 800,
                mouseMoveRadius: 10,
                touchMoveRadius: 10,
                intervals: [],
                intervalContentGenerator: () => null,
                previewBoundsGenerator: defaultPreviewBoundsGenerator,
                onDoubleTap: noop,
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
            function formatState(s) {
                //return JSON.stringify(s.action);
            }
            var SM_Subscription = allInputs.subscribe(update => {
                try {
                    /* ONLY THIS FUNCTION IS ALLOWED TO CHANGE THE STATE DIRECTLY */
                    var { my_state: state, inputObserver } = this;

                    if (this.__deltaRunnging) { console.error(Error(NESTED_DELTAS_ERROR)); }
                    this.__deltaRunnging = true;
                    var newState = deltaFunction(state, update, inputObserver, environment, SM_Subscription.dispose.bind(SM_Subscription));
                    this.__deltaRunnging = false;

                    if (newState !== state) {
                        if (state.action && (!newState.action || newState.action.constructor !== state.action.constructor)) {
                            var exitHook = state.action && state.action.constructor && stateExitClearTimeoutHooks.get(state.action.constructor);
                            if (exitHook) {
                                exitHook(state, update, newState);
                            }
                        }
                        this.my_state = newState;
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

            return this.my_state = new TimeBarState({
                action: null,
                ...initialProps.toObject()
            });
        },
        componentWillReceiveProps: function(newProps) {
            var { inputObserver } = this;
            inputObserver.onNext({
                type: PROPERTY_CHANGE,
                newProps: propsToImmutable(newProps)
            });
        },
        componentWillUnmount: function() {
            var { inputObserver } = this;
            inputObserver.onNext({ type: TERMINATE });
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
                        type: INTERVAL_MOUSE_DOWN,
                        intervalId: interval.id,
                        side: side,
                        initialCoords: { x: e.clientX, y: e.clientY },
                        timeBeforeDrag: timeBeforeDrag
                    });
                    e.preventDefault();
                    e.stopPropagation();
                };

                var touchStartHandlerGen = (side, timeBeforeDrag) => e => {
                    var touch = e.changedTouches[0];
                    inputObserver.onNext({
                        type: INTERVAL_TOUCH_START,
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
                        type: INTERVAL_TOUCH_MOVE,
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
                        type: INTERVAL_TOUCH_END,
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

            var intervalPreview = !(action instanceof PreviewAction) ? null : (() => {
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
                        type: BAR_MOUSE_MOVE,
                        offset: offset
                    });
                } else {
                    inputObserver.onNext({
                        type: BAR_MOUSE_LEAVE
                    });
                }
            };

            var barMouseLeave = e => {
                inputObserver.onNext({
                    type: BAR_MOUSE_LEAVE
                });
            };

            var touchHandler = e => {
                e.preventDefault();
                e.stopPropagation();

                var touch = e.changedTouches[0];

                var type;
                switch (e.type) {
                    case "touchstart": type = BAR_TOUCH_START; break;
                    case "touchend": type = BAR_TOUCH_END; break;
                }

                var barElement = React.findDOMNode(this);
                var boundingRect = barElement.getBoundingClientRect();
                var [page, bounding] = direction === 'horizontal' ? [touch.pageX, boundingRect.left + window.scrollX] : [touch.pageY, boundingRect.top + window.scrollY];
                var offset = page - bounding;

                inputObserver.onNext({
                    type: type,
                    touchId: touch.identifier,
                    coords: { x: touch.clientX, y: touch.clientY },
                    offset: offset
                });
            };

            return (<div className={["time-bar", direction].join(" ")}
                        style={(direction === "horizontal") ? { width: width } : { height: width }}
                        onMouseMove={barMouseMove}
                        onMouseLeave={barMouseLeave}
                        onTouchStart={touchHandler}
                        onTouchEnd={touchHandler}>
                {intervalPreview}
                {mappedIntervals}
            </div>);
        }
    });
};

export var TimeBar = (window && window.document) ? getTimeBarComponent({ capturedMouseEvents: captureMouseEventsOnDomNode(window.document) }) : null;
