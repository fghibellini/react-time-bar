
require("!style!css!less!./styles.less");

var rx = require("rx");
var React = require("react");

import { timeToPercentil } from './functions/time-functions';
import { mergeInputs } from './functions/utils';
import { TimeBarState, DraggingState, intervalsToImmutable, propsToImmutable, TERMINATION_MSG  } from './state';
import { deltaFunction } from './delta-function';

var noop = rx.helpers.noop;

export function inputStreamsFromDocument(document) {
    var mouseUps   = rx.Observable.fromEvent(document, 'mouseup');
    var mouseMoves = rx.Observable.fromEvent(document, 'mousemove');
    return rx.Observable.merge([mouseUps, mouseMoves]);
}

export function getTimeBarComponent(inputStreams) {

    inputStreams = inputStreams || inputStreamsFromDocument(window.document);

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
            }))
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
                intervals: []
            };
        },
        getAllInputs: function() {
            var componentInputs = this.inputObserver = new rx.Subject();
            return mergeInputs([componentInputs, inputStreams]);
        },
        setupStateMachine: function(allInputs, deltaFunction) {
            var SM_Subscription = allInputs.subscribe(update => {
                if (!update) console.log("UNDEFINED INPUT!!!!");
                // ONLY THIS FUNCTION IS ALLOWED TO CHANGE THE STATE DIRECTLY
                var { state, inputObserver } = this;
                var newState = deltaFunction(state, update, inputObserver, SM_Subscription.dispose.bind(SM_Subscription));
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
            var { state: { min, max, width, intervals }, inputObserver } = this;

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
                </div>);
            });

            return (<div className="time-bar"
                        style={{ width: width }}>
                {mappedIntervals}
            </div>);
        }
    });
};

export var TimeBar = (window && window.document) ? getTimeBarComponent() : null;
