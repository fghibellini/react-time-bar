define("react-time-bar", ["rx","immutable","react","rx-dom"], function(__WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_6__, __WEBPACK_EXTERNAL_MODULE_13__, __WEBPACK_EXTERNAL_MODULE_14__) { return /******/ (function(modules) { // webpackBootstrap
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

	exports.captureMouseEventsOnDomNode = captureMouseEventsOnDomNode;
	exports.getTimeBarComponent = getTimeBarComponent;

	var _functionsTimeFunctions = __webpack_require__(2);

	var _functionsUtils = __webpack_require__(3);

	var _state2 = __webpack_require__(5);

	var _deltaFunction = __webpack_require__(7);

	__webpack_require__(9);

	var rx = __webpack_require__(4);
	var React = __webpack_require__(13);

	__webpack_require__(14);

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

	function captureMouseEventsOnDomNode(domNode) {
	    var mouseUps = rx.DOM.fromEvent(domNode, 'mouseup', null, true);
	    var mouseMoves = rx.DOM.fromEvent(domNode, 'mousemove', null, true);
	    var inputStreams = rx.Observable.merge([mouseUps, mouseMoves])["do"](function (e) {
	        return e.stopPropagation();
	    });
	    return inputStreams;
	}

	function getTimeBarComponent(environment) {

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
	                id: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
	                from: React.PropTypes.string,
	                to: React.PropTypes.string,
	                className: React.PropTypes.string
	            }))
	        },
	        getDefaultProps: function getDefaultProps() {
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
	        getAllInputs: function getAllInputs() {
	            var inputSubject = new rx.Subject();
	            this.inputObserver = inputSubject;
	            return (0, _functionsUtils.mergeInputs)([inputSubject, capturedMouseEvents]).observeOn(rx.Scheduler.currentThread);
	        },
	        setupStateMachine: function setupStateMachine(allInputs, deltaFunction) {
	            var _this = this;

	            var SM_Subscription = allInputs.subscribe(function (update) {
	                /* ONLY THIS FUNCTION IS ALLOWED TO CHANGE THE STATE DIRECTLY */
	                var state = _this.state;
	                var inputObserver = _this.inputObserver;

	                if (_this.__deltaRunnging) {
	                    throw Error(NESTED_DELTAS_ERROR);
	                }
	                _this.__deltaRunnging = true;
	                var newState = deltaFunction(state, update, inputObserver, environment, SM_Subscription.dispose.bind(SM_Subscription));
	                _this.__deltaRunnging = false;

	                if (newState !== state) {
	                    _this.replaceState(newState);
	                }
	            }, function (error) {
	                console.error(error);
	            }, function () {
	                // noop
	            });
	        },
	        getInitialState: function getInitialState() {
	            var initialProps = (0, _state2.propsToImmutable)(this.props);

	            var allInputs = this.getAllInputs();
	            this.setupStateMachine(allInputs, _deltaFunction.deltaFunction);

	            return new _state2.TimeBarState(_extends({
	                dragging: null
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
	            var _state = this.state;
	            var min = _state.min;
	            var max = _state.max;
	            var width = _state.width;
	            var intervals = _state.intervals;
	            var inputObserver = this.inputObserver;

	            var mappedIntervals = intervals.map(function (interval, intIndex) {
	                var start = width * (0, _functionsTimeFunctions.timeToPercentil)(min, max, interval.from);
	                var end = width * (0, _functionsTimeFunctions.timeToPercentil)(min, max, interval.to);

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
	                        onMouseDown: rightHandleDragStart })
	                );
	            });

	            return React.createElement(
	                "div",
	                { className: "time-bar",
	                    style: { width: width } },
	                mappedIntervals
	            );
	        }
	    });
	}

	;

	var TimeBar = window && window.document ? getTimeBarComponent({ capturedMouseEvents: captureMouseEventsOnDomNode(window.document) }) : null;
	exports.TimeBar = TimeBar;

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.timeStrToMinutes = timeStrToMinutes;
	exports.minutesToStr = minutesToStr;
	exports.timeToPercentil = timeToPercentil;

	function parseDec(s) {
	    return parseInt(s, 10);
	}

	/**
	 * Converts a string of format "HH:MM" to the number
	 * of minutes since 00:00.
	 */

	function timeStrToMinutes(str) {
	    return str.split(":").map(parseDec).reduce(function (h, m) {
	        return h * 60 + m;
	    });
	}

	/**
	 * Converts a number representing the number of minutes from midnight
	 * to a string of format "HH:MM"
	 */

	function minutesToStr(minutes) {
	    var remainderMinutes = minutes % 60;
	    return Math.floor(minutes / 60) + ":" + (remainderMinutes > 10 ? remainderMinutes : "0" + remainderMinutes);
	}

	/**
	 * Given the min and max of a time interval and a time t
	 * it returns at which percentace of that time interval t lies.
	 *
	 * min, max and t are strings of format "HH:MM"
	 *
	 * returns a number between 0 and 1
	 */

	function timeToPercentil(min, max, t) {
	    var minMinutes = timeStrToMinutes(min);
	    var maxMinutes = timeStrToMinutes(max);
	    var durationMinutes = maxMinutes - minMinutes;
	    var tMinutes = timeStrToMinutes(t);
	    var tFromStart = tMinutes - minMinutes;
	    return tFromStart / durationMinutes;
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.mergeInputs = mergeInputs;
	exports.getRemovedIds = getRemovedIds;
	exports.modifyTimeByPixels = modifyTimeByPixels;

	var _timeFunctions = __webpack_require__(2);

	var rx = __webpack_require__(4),
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

	function computeDeltaInMinutes(min, max, width, deltaPx) {
	    var minMinutes = (0, _timeFunctions.timeStrToMinutes)(min);
	    var maxMinutes = (0, _timeFunctions.timeStrToMinutes)(max);
	    var intervalDuration = maxMinutes - minMinutes;
	    var pixelDuration = intervalDuration / width;
	    return Math.round(deltaPx * pixelDuration);
	}

	function modifyTimeByPixels(min, max, width, t0, deltaPx) {
	    var deltaMinutes = computeDeltaInMinutes(min, max, width, deltaPx);
	    var t0InMinutes = (0, _timeFunctions.timeStrToMinutes)(t0);

	    return (0, _timeFunctions.minutesToStr)(t0InMinutes + deltaMinutes);
	}

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_4__;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.intervalsToImmutable = intervalsToImmutable;
	exports.propsToImmutable = propsToImmutable;

	function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

	var _functionsUtils = __webpack_require__(3);

	var Immutable = __webpack_require__(6);

	var TERMINATION_MSG = {};

	exports.TERMINATION_MSG = TERMINATION_MSG;
	var TimeBarState = new Immutable.Record({
	    dragging: null,
	    // the following are digested props
	    min: "8:00",
	    max: "18:00",
	    width: 400,
	    onStartChange: _functionsUtils.noop,
	    onEndChange: _functionsUtils.noop,
	    onIntervalClick: _functionsUtils.noop,
	    onIntervalDrag: _functionsUtils.noop,
	    intervals: null
	});

	exports.TimeBarState = TimeBarState;
	var Interval = new Immutable.Record({
	    id: null,
	    from: "12:00",
	    to: "13:00",
	    className: ""
	});

	exports.Interval = Interval;
	var Coordinates = new Immutable.Record({
	    x: 0,
	    y: 0
	});

	exports.Coordinates = Coordinates;
	var DraggingState = new Immutable.Record({
	    intervalId: null, // the id of the dragged interval
	    side: "both", // one of: "left", "right", "both"
	    initialCoords: new Coordinates(), // the coordinates of the mousedown that initiated the drag
	    timeBeforeDrag: null, // the value of the property modified by the drag before the drag started
	    movedSinceMouseDown: false // a drag starts when the use moves the mouse after a mousedown otherwise it's a click
	});

	exports.DraggingState = DraggingState;

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
	    min: null,
	    max: null,
	    width: null,
	    onStartChange: null,
	    onEndChange: null,
	    onIntervalClick: null,
	    onIntervalDrag: null,
	    intervals: new Immutable.List([])
	});

	exports.Props = Props;

	function propsToImmutable(propsObject) {
	    var intervals = propsObject.intervals;

	    var otherProps = _objectWithoutProperties(propsObject, ["intervals"]);

	    return new Props(_extends({
	        intervals: intervalsToImmutable(intervals)
	    }, otherProps));
	}

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_6__;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports.deltaFunction = deltaFunction;

	var _state = __webpack_require__(5);

	var _functionsGlobalCursor = __webpack_require__(8);

	var _functionsUtils = __webpack_require__(3);

	function dragStart(state, intervalId, side, initialCoords, timeBeforeDrag) {
	    var newState = state.set("dragging", new _state.DraggingState({
	        intervalId: intervalId,
	        side: side,
	        initialCoords: initialCoords,
	        timeBeforeDrag: timeBeforeDrag,
	        movedSinceMouseDown: false
	    }));
	    return newState;
	}

	function drag(state, newCoords) {
	    var dragging = state.dragging;
	    var min = state.min;
	    var max = state.max;
	    var width = state.width;
	    var onStartChange = state.onStartChange;
	    var onEndChange = state.onEndChange;
	    var onIntervalDrag = state.onIntervalDrag;
	    var intervalId = dragging.intervalId;
	    var side = dragging.side;
	    var timeBeforeDrag = dragging.timeBeforeDrag;
	    var initialCoords = dragging.initialCoords;
	    var movedSinceMouseDown = dragging.movedSinceMouseDown;

	    var newTime = (0, _functionsUtils.modifyTimeByPixels)(min, max, width, timeBeforeDrag, newCoords.x - initialCoords.x);

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

	        var newDraggingState = dragging.set("movedSinceMouseDown", true);
	        var newState = state.set("dragging", newDraggingState);
	        return newState;
	    } else {
	        return state;
	    }
	}

	function dragEnd(state, capturedMouseEvents) {
	    var _state$dragging = state.dragging;
	    var intervalId = _state$dragging.intervalId;
	    var movedSinceMouseDown = _state$dragging.movedSinceMouseDown;
	    var onIntervalClick = state.onIntervalClick;

	    if (movedSinceMouseDown) {
	        (0, _functionsGlobalCursor.unsetCursorToWholeDocument)(window.document);
	    }

	    capturedMouseEvents.pause();
	    var newState = state.set("dragging", null);
	    return newState;
	}

	function deltaFunction(state, input, stream, environment, terminate) {
	    var dragging = state.dragging;
	    var capturedMouseEvents = environment.capturedMouseEvents;

	    var newState = state;

	    if (input === _state.TERMINATION_MSG) {
	        if (dragging) {
	            newState = dragEnd(state, capturedMouseEvents);
	        }
	        terminate();
	    } else if (input.type === "mousedown") {
	        var intervalId = input.intervalId;
	        var side = input.side;
	        var initialCoords = input.initialCoords;
	        var timeBeforeDrag = input.timeBeforeDrag;

	        capturedMouseEvents.resume();
	        newState = dragStart(state, intervalId, side, initialCoords, timeBeforeDrag);
	    } else if (input.type === "mousemove") {
	        if (dragging) {
	            newState = drag(state, input);
	        }
	    } else if (input.type === "mouseup") {
	        if (dragging) {
	            var dragging = state.dragging;
	            var onIntervalClick = state.onIntervalClick;
	            var intervalId = dragging.intervalId;
	            var movedSinceMouseDown = dragging.movedSinceMouseDown;

	            if (!movedSinceMouseDown) {
	                onIntervalClick(intervalId, null);
	            }
	            newState = dragEnd(state, capturedMouseEvents);
	        }
	    } else if (input.type === "propchange") {
	        var newProps = input.newProps;

	        if (dragging) {
	            var intervalId = dragging.intervalId;

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
/* 8 */
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
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(10);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(12)(content, {});
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
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(11)();
	// imports


	// module
	exports.push([module.id, ".time-bar {\n  position: relative;\n  background: #eeeeee;\n  display: inline-block;\n  box-sizing: border-box;\n  height: 30px;\n  cursor: normal;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.interval {\n  position: absolute;\n  display: inline-block;\n  box-sizing: border-box;\n  top: 0;\n  height: 100%;\n  border: 2px solid #cccccc;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n  /* VERY LAGGY & CPU intensive\n    transition: @movement-duration left ease-out, @movement-duration width ease-out;\n    will-change: left, width; */\n}\n.interval-handle {\n  position: absolute;\n  display: block;\n  box-sizing: border-box;\n  top: 0;\n  height: auto;\n  bottom: 0;\n  width: 8px;\n  margin: -2px;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.interval-handle-left {\n  left: 0;\n  cursor: w-resize;\n  border-left: 2px solid #cccccc;\n}\n.interval-handle-right {\n  right: 0;\n  cursor: e-resize;\n  border-right: 2px solid #cccccc;\n}\n", ""]);

	// exports


/***/ },
/* 11 */
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
/* 12 */
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


/***/ },
/* 13 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_13__;

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_14__;

/***/ }
/******/ ])});;