
var rx = require("rx");

var noop = rx.helpers.noop;
var AnonymousObservable = rx.AnonymousObservable;
var fromPromise = rx.Observable.fromPromise;
var isPromise = rx.helpers.isPromise;

/**
 * Behaves the same way as takeUntil but it also returns the value
 * produced by the second observable.
 */
rx.Observable.prototype.takeUntilJoined = function takeUntilJoined(other) {
    var source = this;

    return new AnonymousObservable(function(observer) {
        isPromise(other) && (other = fromPromise(other));
        var disposable1 = source.subscribe(observer);

        var disposable2 = other.subscribe(function(terminationValue) {
            observer.onNext(terminationValue);
            observer.onCompleted();
        }, function(error) {
            observer.onError(error);
        }, noop);

        return function() {
            disposable1.dispose();
            disposable2.dispose();
        };
    });
};
