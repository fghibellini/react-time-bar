
require("!style!css!less!./styles.less");

var rx = require("rx");
var React = require("react");

require("rx-dom");

import { timeToPercentil, percentilToTime, addMinutes, minutesToStr, timeStrToMinutes } from './functions/time-functions';
import { mergeInputs } from './functions/utils';
import { TimeBarState, DraggingState, intervalsToImmutable, propsToImmutable, TERMINATION_MSG  } from './state';
import { deltaFunction } from './delta-function';

var noop = rx.helpers.noop;

var NESTED_DELTAS_ERROR = "The delta function is not allowed to synchrously trigger another state transition! This is a bug in the time-bar component.";
var NO_CAPTURED_EVENTS_STREAM_ERROR = "The TimeBar component requires a pausable stream of mouse events!";
var NO_ENVIRONMENT_ERROR = "The TimeBar component requires and environment object!";

/**
 * Returns a pausable observable that captures all the mouseups and mousedowns on the passed domNode.
 * When the observable is enabled the events are captured and their propagation is stopped.
 * When the observable is paused it behaves as if it didn't exist.
 * The observable is paused by default.
 */
export function captureMouseEventsOnDomNode(domNode) {
    var mouseUps   = rx.DOM.fromEvent(domNode, 'mouseup', null, true);
    var mouseMoves = rx.DOM.fromEvent(domNode, 'mousemove', null, true);
    var inputStreams = rx.Observable.merge([mouseUps, mouseMoves]).do(e => e.stopPropagation());
    return inputStreams;
}

var intervalPreviewWidth = 30;
// TODO work on this function
/**
 * assumes the intervals are ordered
 */
function defaultNewIntervalPreviewBounds(startTime, min, max, intervals) {
    startTime = timeStrToMinutes(startTime);

    var prevInterval, nextInterval;
    for (var i = 0, interval; interval = intervals[i]; i++) {
        var iFrom = timeStrToMinutes(interval.from);
        var iTo = timeStrToMinutes(interval.to);
        if (iTo <= startTime)
            prevInterval = interval;
        if (iFrom > startTime) {
            nextInterval = interval;
            break;
        }
    }

    var minStartTime = prevInterval ? timeStrToMinutes(prevInterval.to) : timeStrToMinutes(min);
    var maxEndTime = nextInterval ? timeStrToMinutes(nextInterval.from) : timeStrToMinutes(max);

    if (intervalPreviewWidth > (maxEndTime - minStartTime)) {
        return null;
    } else {
        var startTimeUnbounded = startTime - intervalPreviewWidth / 2;
        var start, end;
        if (startTimeUnbounded < minStartTime) {
            start = minStartTime;
            end = start + intervalPreviewWidth;
        } else {
            var endTimeUnbounded = startTime + intervalPreviewWidth / 2;
            end = endTimeUnbounded > maxEndTime ? maxEndTime : endTimeUnbounded;
            start = end - intervalPreviewWidth;
        }
        return { from: minutesToStr(start), to: minutesToStr(end) };
    }
}

export function getTimeBarComponent(environment) {

    if (!environment) {
        throw Error(NO_ENVIRONMENT_ERROR);
    }
    if (!environment.capturedMouseEvents) {
        throw Error(NO_CAPTURED_EVENTS_STREAM_ERROR);
    }

    var capturedMouseEvents = environment.capturedMouseEvents.pausable();
    capturedMouseEvents.pause();
    environment.capturedMouseEvents = capturedMouseEvents; // TODO modifying the environment object is not ideal, ?maybe clone it?

    return React.createClass({
        displayName: "TimeBar",
        propTypes: {
            min: React.PropTypes.string,
            max: React.PropTypes.string,
            width: React.PropTypes.number,
            onStartChange: React.PropTypes.func,
            onEndChange: React.PropTypes.func,
            onIntervalClick: React.PropTypes.func,
            onIntervalDrag: React.PropTypes.func,
            intervals: React.PropTypes.arrayOf(React.PropTypes.shape({
                id: React.PropTypes.oneOfType([
                    React.PropTypes.number,
                    React.PropTypes.string
                ]),
                from: React.PropTypes.string,
                to: React.PropTypes.string,
                className: React.PropTypes.string
            })),
            intervalContentGen: React.PropTypes.func,
            newIntervalPreviewBounds: React.PropTypes.func,
            createNewInterval: React.PropTypes.func
        },
        getDefaultProps: function() {
            return {
                min: "8:00",
                max: "18:00",
                width: 800,
                onStartChange: noop,
                onEndChange: noop,
                onIntervalClick: noop,
                onIntervalDrag: noop,
                intervals: [],
                intervalContentGen: interval => <span className="interval-content">{interval.from + " - " + interval.to}</span>,
                newIntervalPreviewBounds: defaultNewIntervalPreviewBounds,
                createNewInterval: noop
            };
        },
        getAllInputs: function() {
            var inputSubject = new rx.Subject();
            this.inputObserver = inputSubject;
            return mergeInputs([inputSubject, capturedMouseEvents]).observeOn(rx.Scheduler.currentThread);
        },
        setupStateMachine: function(allInputs, deltaFunction) {
            var SM_Subscription = allInputs.subscribe(update => {
                /* ONLY THIS FUNCTION IS ALLOWED TO CHANGE THE STATE DIRECTLY */
                var { state, inputObserver } = this;

                if (this.__deltaRunnging) { throw Error(NESTED_DELTAS_ERROR); }
                this.__deltaRunnging = true;
                var newState = deltaFunction(state, update, inputObserver, environment, SM_Subscription.dispose.bind(SM_Subscription));
                this.__deltaRunnging = false;

                if (newState !== state) {
                    this.replaceState(newState);
                }
            }, error => {
                console.error(error);
            }, () => {
                // noop
            });
        },
        getInitialState: function() {
            var initialProps = propsToImmutable(this.props);

            var allInputs = this.getAllInputs();
            this.setupStateMachine(allInputs, deltaFunction);

            return new TimeBarState({
                dragging: null,
                displayNewIntPreview: false,
                potentialIntervalX: null,
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
            var { state: { min, max, width, intervals, intervalContentGen, potentialIntervalX, newIntervalPreviewBounds, displayNewIntPreview, createNewInterval }, inputObserver } = this;

            var mappedIntervals = intervals.map((interval, intIndex) => {
                var start = width * timeToPercentil(min, max, interval.from);
                var end = width * timeToPercentil(min, max, interval.to);

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
                    {intervalContentGen(interval)}
                </div>);
            });

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

            var previewClick = e => {
                e.stopPropagation();
                var startTime = percentilToTime(min, max, potentialIntervalX / width);
                var bounds = newIntervalPreviewBounds(startTime, min, max, intervals.toJS());
                createNewInterval(bounds);
            };

            var newIntervalGhost = !displayNewIntPreview ? null : (() => {
                var startTime = percentilToTime(min, max, potentialIntervalX / width);
                var bounds = newIntervalPreviewBounds(startTime, min, max, intervals.toJS());

                if (bounds === null) {
                    return null;
                } else {
                    var start = width * timeToPercentil(min, max, bounds.from);
                    var end = width * timeToPercentil(min, max, bounds.to);
                    return (<div className="new-interval"
                                 style={{ left: start, width: end - start }}
                                 onClick={previewClick}>+</div>);
                }
            })();

            return (<div className="time-bar"
                        style={{ width: width }}
                        onMouseMove={barMouseMove}
                        onMouseLeave={barMouseLeave}>
                {newIntervalGhost}
                {mappedIntervals}
            </div>);
        }
    });
};

export var TimeBar = (window && window.document) ? getTimeBarComponent({ capturedMouseEvents: captureMouseEventsOnDomNode(window.document) }) : null;
