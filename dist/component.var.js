var ReactTimeBar =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.getTimeBarComponent = getTimeBarComponent;

	var _functionsUtils = __webpack_require__(2);

	var _state2 = __webpack_require__(4);

	var _deltaFunction = __webpack_require__(6);

	var _mouseEventCapturing = __webpack_require__(8);

	var _functionsCommon = __webpack_require__(10);

	__webpack_require__(12);

	var rx = __webpack_require__(3);
	var React = __webpack_require__(11);

	var noop = rx.helpers.noop;

	var NESTED_DELTAS_ERROR = "The delta function is not allowed to synchrously trigger another state transition! This is a bug in the time-bar component.";
	var NO_CAPTURED_EVENTS_STREAM_ERROR = "The TimeBar component requires a pausable stream of mouse events!";
	var NO_ENVIRONMENT_ERROR = "The TimeBar component requires and environment object!";

	function getTimeBarComponent(environmentArgs) {

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
	                id: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
	                from: React.PropTypes.number,
	                to: React.PropTypes.number,
	                className: React.PropTypes.string
	            })),
	            intervalContentGenerator: React.PropTypes.func,
	            previewBoundsGenerator: React.PropTypes.func,
	            onIntervalNew: React.PropTypes.func
	        },
	        getDefaultProps: function getDefaultProps() {
	            return {
	                max: 1440,
	                width: 800,
	                onStartChange: noop,
	                onEndChange: noop,
	                onIntervalClick: noop,
	                onIntervalDrag: noop,
	                onDragEnd: noop,
	                intervals: [],
	                intervalContentGenerator: function intervalContentGenerator() {
	                    return null;
	                },
	                previewBoundsGenerator: _functionsCommon.defaultPreviewBoundsGenerator,
	                onIntervalNew: noop
	            };
	        },
	        getAllInputs: function getAllInputs() {
	            var inputSubject = new rx.Subject();
	            this.inputObserver = inputSubject;
	            return (0, _functionsUtils.mergeInputs)([inputSubject, capturedMouseEvents]).observeOn(rx.Scheduler.currentThread);
	        },
	        setupStateMachine: function setupStateMachine(allInputs, deltaFunction) {
	            var _this = this;

	            var SM_Subscription = allInputs.subscribe(function (update) {
	                try {
	                    /* ONLY THIS FUNCTION IS ALLOWED TO CHANGE THE STATE DIRECTLY */
	                    var state = _this.state;
	                    var inputObserver = _this.inputObserver;

	                    if (_this.__deltaRunnging) {
	                        console.error(Error(NESTED_DELTAS_ERROR));
	                    }
	                    _this.__deltaRunnging = true;
	                    var newState = deltaFunction(state, update, inputObserver, environment, SM_Subscription.dispose.bind(SM_Subscription));
	                    _this.__deltaRunnging = false;

	                    if (newState !== state) {
	                        _this.replaceState(newState);
	                    }
	                } catch (e) {
	                    // Prevent unexpected errors to freeze the time bar.
	                    console.error(e);
	                }
	            }, function (error) {
	                // One of the input streams failed.
	                console.error(error);
	            });
	        },
	        getInitialState: function getInitialState() {
	            var initialProps = (0, _state2.propsToImmutable)(this.props);

	            var allInputs = this.getAllInputs();
	            this.setupStateMachine(allInputs, _deltaFunction.deltaFunction);

	            return new _state2.TimeBarState(_extends({
	                action: null
	            }, initialProps.toObject()));
	        },
	        componentWillReceiveProps: function componentWillReceiveProps(newProps) {
	            var inputObserver = this.inputObserver;

	            var newPropUpdate = {
	                type: "propchange",
	                newProps: (0, _state2.propsToImmutable)(newProps)
	            };
	            inputObserver.onNext(newPropUpdate);
	        },
	        componentWillUnmount: function componentWillUnmount() {
	            var inputObserver = this.inputObserver;

	            inputObserver.onNext(_state2.TERMINATION_MSG);
	        },
	        render: function render() {
	            var _this2 = this;

	            var _state = this.state;
	            var action = _state.action;
	            var max = _state.max;
	            var width = _state.width;
	            var intervals = _state.intervals;
	            var intervalContentGenerator = _state.intervalContentGenerator;
	            var previewBoundsGenerator = _state.previewBoundsGenerator;
	            var onIntervalNew = _state.onIntervalNew;
	            var inputObserver = this.inputObserver;

	            // THE DISPLAYED INTERVALS

	            var mappedIntervals = intervals.map(function (interval, intIndex) {
	                var start = width * interval.from / max;
	                var end = width * interval.to / max;

	                var mouseDownHandlerGen = function mouseDownHandlerGen(side, timeBeforeDrag) {
	                    return function (e) {
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
	                };

	                var leftHandleDragStart = mouseDownHandlerGen("left", interval.from);
	                var rightHandleDragStart = mouseDownHandlerGen("right", interval.to);
	                var intervalDragStart = mouseDownHandlerGen("whole", interval.from);

	                return React.createElement(
	                    "div",
	                    { className: ["interval", interval.className].join(" "),
	                        key: interval.id,
	                        onMouseDown: intervalDragStart,
	                        style: { left: start, width: end - start } },
	                    React.createElement("div", { className: "interval-handle interval-handle-left",
	                        onMouseDown: leftHandleDragStart }),
	                    React.createElement("div", { className: "interval-handle interval-handle-right",
	                        onMouseDown: rightHandleDragStart }),
	                    intervalContentGenerator(interval)
	                );
	            });

	            // THE PREVIEW OF A NEW INERVAL

	            var intervalPreview = !(action && action instanceof _state2.PreviewAction) ? null : (function () {
	                var x = action.x;
	                var startTime = max * x / width;
	                var bounds = previewBoundsGenerator(startTime, max, intervals.toJS());

	                var previewClick = function previewClick(e) {
	                    e.stopPropagation();
	                    onIntervalNew(bounds);
	                };

	                if (bounds === null) {
	                    return null;
	                } else {
	                    var start = width * bounds.from / max;
	                    var end = width * bounds.to / max;
	                    return React.createElement(
	                        "div",
	                        { className: "new-interval",
	                            style: { left: start, width: end - start },
	                            onClick: previewClick },
	                        "+"
	                    );
	                }
	            })();

	            // THE TIME BAR ITSELF

	            var barMouseMove = function barMouseMove(e) {
	                var barElement = React.findDOMNode(_this2);
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

	            var barMouseLeave = function barMouseLeave(e) {
	                inputObserver.onNext({
	                    type: "bar-mouseleave"
	                });
	            };

	            return React.createElement(
	                "div",
	                { className: "time-bar",
	                    style: { width: width },
	                    onMouseMove: barMouseMove,
	                    onMouseLeave: barMouseLeave },
	                intervalPreview,
	                mappedIntervals
	            );
	        }
	    });
	}

	;

	var TimeBar = window && window.document ? getTimeBarComponent({ capturedMouseEvents: (0, _mouseEventCapturing.captureMouseEventsOnDomNode)(window.document) }) : null;
	exports.TimeBar = TimeBar;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.mergeInputs = mergeInputs;
	exports.getRemovedIds = getRemovedIds;

	var rx = __webpack_require__(3),
	    mergeObservables = rx.Observable.merge;

	var noop = rx.helpers.noop;

	exports.noop = noop;

	function mergeInputs(inputObservables) {
	    return mergeObservables.apply(null, inputObservables);
	}

	function getRemovedIds(oldIntervals, newIntervals) {
	    var removed = [];
	    outer: for (var i = 0, ii = oldIntervals.size; i < ii; i++) {
	        var oldId = oldIntervals.get(i).id;
	        for (var j = 0, jj = newIntervals.size; j < jj; j++) {
	            if (oldId == newIntervals.get(j).id) {
	                continue outer;
	            }
	        }
	        removed.push(oldId);
	    }
	    return removed;
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = Rx;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.intervalsToImmutable = intervalsToImmutable;
	exports.propsToImmutable = propsToImmutable;

	function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

	var _functionsUtils = __webpack_require__(2);

	var Immutable = __webpack_require__(5);

	var TERMINATION_MSG = {};

	exports.TERMINATION_MSG = TERMINATION_MSG;
	var Interval = new Immutable.Record({
	    id: null,
	    from: null,
	    to: null,
	    className: ""
	});

	exports.Interval = Interval;
	var Coordinates = new Immutable.Record({
	    x: 0,
	    y: 0
	});

	exports.Coordinates = Coordinates;

	function intervalsToImmutable(intervalsArray) {
	    return Immutable.fromJS(intervalsArray, function (key, value) {
	        if (key === "") {
	            return new Immutable.List(value);
	        } else {
	            return new Interval(value);
	        }
	    });
	}

	var Props = new Immutable.Record({
	    max: null,
	    width: null,
	    onStartChange: null,
	    onEndChange: null,
	    onIntervalClick: null,
	    onIntervalDrag: null,
	    onDragEnd: null,
	    intervals: new Immutable.List([]),
	    intervalContentGenerator: null,
	    previewBoundsGenerator: null,
	    onIntervalNew: null
	});

	exports.Props = Props;

	function propsToImmutable(propsObject) {
	    var intervals = propsObject.intervals;

	    var otherProps = _objectWithoutProperties(propsObject, ["intervals"]);

	    return new Props(_extends({
	        intervals: intervalsToImmutable(intervals)
	    }, otherProps));
	}

	var TimeBarState = new Immutable.Record({
	    action: null,
	    // the following are digested props
	    max: 1440,
	    width: 400,
	    onStartChange: _functionsUtils.noop,
	    onEndChange: _functionsUtils.noop,
	    onIntervalClick: _functionsUtils.noop,
	    onIntervalDrag: _functionsUtils.noop,
	    onDragEnd: _functionsUtils.noop,
	    intervals: null,
	    intervalContentGenerator: _functionsUtils.noop,
	    previewBoundsGenerator: _functionsUtils.noop,
	    onIntervalNew: _functionsUtils.noop
	});

	exports.TimeBarState = TimeBarState;
	var PreviewAction = new Immutable.Record({
	    x: null
	});

	exports.PreviewAction = PreviewAction;
	var DraggingAction = new Immutable.Record({
	    intervalId: null, // the id of the dragged interval
	    side: "both", // one of: "left", "right", "both"
	    initialCoords: new Coordinates(), // the coordinates of the mousedown that initiated the drag
	    timeBeforeDrag: null, // the value of the property modified by the drag before the drag started
	    movedSinceMouseDown: false // a drag starts when the use moves the mouse after a mousedown otherwise it's a click
	});
	exports.DraggingAction = DraggingAction;

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = Immutable;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports.deltaFunction = deltaFunction;

	var _state = __webpack_require__(4);

	var _functionsGlobalCursor = __webpack_require__(7);

	var _functionsUtils = __webpack_require__(2);

	function dragStart(state, intervalId, side, initialCoords, timeBeforeDrag) {
	    var newState = state.set("action", new _state.DraggingAction({
	        intervalId: intervalId,
	        side: side,
	        initialCoords: initialCoords,
	        timeBeforeDrag: timeBeforeDrag,
	        movedSinceMouseDown: false
	    }));
	    return newState;
	}

	function drag(state, newCoords) {
	    var max = state.max;
	    var width = state.width;
	    var onStartChange = state.onStartChange;
	    var onEndChange = state.onEndChange;
	    var onIntervalDrag = state.onIntervalDrag;
	    var _state$action = state.action;
	    var intervalId = _state$action.intervalId;
	    var side = _state$action.side;
	    var timeBeforeDrag = _state$action.timeBeforeDrag;
	    var initialCoords = _state$action.initialCoords;
	    var movedSinceMouseDown = _state$action.movedSinceMouseDown;

	    var deltaPx = newCoords.clientX - initialCoords.x;
	    var newTime = timeBeforeDrag + max * deltaPx / width;

	    if (side === "left") {
	        onStartChange(intervalId, newTime);
	    } else if (side === "right") {
	        onEndChange(intervalId, newTime);
	    } else if (side === "whole") {
	        onIntervalDrag(intervalId, newTime);
	    }

	    if (!movedSinceMouseDown) {
	        var cursorName = ({
	            left: "w-resize",
	            right: "e-resize",
	            whole: "move"
	        })[side];
	        (0, _functionsGlobalCursor.setCursorToWholeDocument)(window.document, cursorName);

	        var newDraggingAction = state.action.set("movedSinceMouseDown", true);
	        var newState = state.set("action", newDraggingAction);
	        return newState;
	    } else {
	        return state;
	    }
	}

	function dragEnd(state, capturedMouseEvents) {
	    var _state$action2 = state.action;
	    var intervalId = _state$action2.intervalId;
	    var movedSinceMouseDown = _state$action2.movedSinceMouseDown;
	    var onIntervalClick = state.onIntervalClick;

	    if (movedSinceMouseDown) {
	        (0, _functionsGlobalCursor.unsetCursorToWholeDocument)(window.document);
	    }

	    capturedMouseEvents.pause();
	    var newState = state.set("action", null);
	    return newState;
	}

	function deltaFunction(state, input, stream, environment, terminate) {
	    var action = state.action;
	    var onIntervalClick = state.onIntervalClick;
	    var onDragEnd = state.onDragEnd;
	    var capturedMouseEvents = environment.capturedMouseEvents;

	    var newState = state;

	    if (input === _state.TERMINATION_MSG) {
	        if (action && action instanceof _state.DraggingAction) {
	            newState = dragEnd(state, capturedMouseEvents);
	        }
	        terminate();
	    } else if (input.type === "bar-mousemove") {
	        newState = state.set("action", new _state.PreviewAction({ x: input.x }));
	    } else if (input.type === "bar-mouseleave") {
	        if (action && action instanceof _state.PreviewAction) {
	            newState = state.set("action", null);
	        }
	    } else if (input.type === "mousedown") {
	        var intervalId = input.intervalId;
	        var side = input.side;
	        var initialCoords = input.initialCoords;
	        var timeBeforeDrag = input.timeBeforeDrag;

	        capturedMouseEvents.resume();
	        newState = dragStart(state, intervalId, side, initialCoords, timeBeforeDrag);
	    } else if (input.type === "mousemove") {
	        if (action && action instanceof _state.DraggingAction) {
	            newState = drag(state, input);
	        }
	    } else if (input.type === "mouseup") {
	        if (action && action instanceof _state.DraggingAction) {
	            var intervalId = action.intervalId;
	            var movedSinceMouseDown = action.movedSinceMouseDown;

	            if (!movedSinceMouseDown) {
	                onIntervalClick(intervalId, null);
	            } else {
	                onDragEnd(intervalId);
	            }
	            newState = dragEnd(state, capturedMouseEvents);
	        }
	    } else if (input.type === "propchange") {
	        var newProps = input.newProps;

	        if (action && action instanceof _state.DraggingAction) {
	            var intervalId = action.intervalId;

	            var removedElements = (0, _functionsUtils.getRemovedIds)(state.intervals, newProps.intervals);
	            if (~removedElements.indexOf(intervalId)) {
	                newState = dragEnd(state, capturedMouseEvents);
	            }
	        }
	        newState = newState.merge(newProps);
	    } else {
	        console.error("unexpected type of input; ignoring");
	    }

	    return newState;
	}

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.setCursorToWholeDocument = setCursorToWholeDocument;
	exports.unsetCursorToWholeDocument = unsetCursorToWholeDocument;

	function setCursorToWholeDocument(document, cursorName) {
	    var head = document.head;
	    var element = document.createElement("style");
	    element.id = "drag-style";
	    var text = document.createTextNode("* { cursor: " + cursorName + " !important; } ");
	    element.appendChild(text);
	    head.appendChild(element);
	}

	function unsetCursorToWholeDocument(document) {
	    var element = document.getElementById("drag-style");
	    element.parentNode.removeChild(element);
	}

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.captureMouseEventsOnDomNode = captureMouseEventsOnDomNode;

	var rx = __webpack_require__(3);

	__webpack_require__(9);

	/**
	 * Returns an observable that captures and stops the propagation of all the mouseups and mousemoves on the passed domNode.
	 */

	function captureMouseEventsOnDomNode(domNode) {
	    var mouseUps = rx.DOM.fromEvent(domNode, 'mouseup', null, true);
	    var mouseMoves = rx.DOM.fromEvent(domNode, 'mousemove', null, true);
	    var inputStreams = rx.Observable.merge([mouseUps, mouseMoves])["do"](function (e) {
	        return e.stopPropagation();
	    });
	    return inputStreams;
	}

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = Rx.DOM;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.defaultPreviewBoundsGenerator = defaultPreviewBoundsGenerator;

	var React = __webpack_require__(11);

	function defaultPreviewBoundsGenerator(startTime, max, intervals) {
	    var intervalPreviewWidth = 60;

	    var prevInterval, nextInterval;
	    for (var i = 0, interval; interval = intervals[i]; i++) {
	        if (interval.to <= startTime) prevInterval = interval;
	        if (interval.from > startTime) {
	            nextInterval = interval;
	            break;
	        }
	    }

	    var minStartTime = prevInterval ? prevInterval.to : 0;
	    var maxEndTime = nextInterval ? nextInterval.from : max;

	    if (intervalPreviewWidth > maxEndTime - minStartTime) {
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
	        return { from: start, to: end };
	    }
	}

/***/ },
/* 11 */
/***/ function(module, exports) {

	module.exports = React;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(13);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(15)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../node_modules/css-loader/index.js!./../node_modules/less-loader/index.js!./styles.less", function() {
				var newContent = require("!!./../node_modules/css-loader/index.js!./../node_modules/less-loader/index.js!./styles.less");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(14)();
	// imports


	// module
	exports.push([module.id, ".time-bar {\n  position: relative;\n  background: #eeeeee;\n  display: inline-block;\n  box-sizing: border-box;\n  height: 30px;\n  cursor: normal;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.new-interval {\n  position: absolute;\n  display: inline-block;\n  text-align: center;\n  line-height: 30px;\n  box-sizing: border-box;\n  top: 0;\n  height: 100%;\n  width: 30px;\n  border: 2px solid #cccccc;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  cursor: pointer;\n  font-weight: bold;\n}\n.interval {\n  position: absolute;\n  display: inline-block;\n  text-align: center;\n  line-height: 30px;\n  box-sizing: border-box;\n  top: 0;\n  height: 100%;\n  border: 2px solid #cccccc;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  /* VERY LAGGY & CPU intensive\n    transition: @movement-duration left ease-out, @movement-duration width ease-out;\n    will-change: left, width; */\n}\n.interval-content {\n  cursor: default;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.interval-handle {\n  position: absolute;\n  display: block;\n  box-sizing: border-box;\n  top: 0;\n  height: auto;\n  bottom: 0;\n  width: 8px;\n  margin: -2px;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.interval-handle-left {\n  left: 0;\n  cursor: w-resize;\n  border-left: 2px solid #cccccc;\n}\n.interval-handle-right {\n  right: 0;\n  cursor: e-resize;\n  border-right: 2px solid #cccccc;\n}\n", ""]);

	// exports


/***/ },
/* 14 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0;

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function createStyleElement() {
		var styleElement = document.createElement("style");
		var head = getHeadElement();
		styleElement.type = "text/css";
		head.appendChild(styleElement);
		return styleElement;
	}

	function createLinkElement() {
		var linkElement = document.createElement("link");
		var head = getHeadElement();
		linkElement.rel = "stylesheet";
		head.appendChild(linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement());
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement();
			update = updateLink.bind(null, styleElement);
			remove = function() {
				styleElement.parentNode.removeChild(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement();
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				styleElement.parentNode.removeChild(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ }
/******/ ]);