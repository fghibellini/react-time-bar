
var React = require("react");
var angular = require("angular");

import { TimeBar } from './component';

function bindToScope(scope, fn) {
    return function() {
        var args = arguments;
        scope.$apply(function() {
            fn.apply(null, args);
        });
    };
}

angular.module("react-timebar", [])

.directive("reactTimeBar", ($document) => {
    console.log("got document: ");
    console.log($document);
    return {
        link: (scope, element, attributes) => {
            console.log("linking directive!");
            var propNames = Object.keys(TimeBar.propTypes);

            scope.$watch(() => {
                var values = {};
                for (var propName of propNames) {
                    var binding = attributes[propName];
                    if (binding) {
                        values[propName] = scope.$eval(binding);
                    }
                }
                return values;
            }, newValues => {
                var withWrappedFunctions = {};
                for (var i in newValues) {
                    withWrappedFunctions[i] = (typeof newValues[i] === 'function') ?  bindToScope(scope, newValues[i]) : newValues[i];
                }

                React.render(
                    <TimeBar { ...withWrappedFunctions} />,
                    element[0]
                );
            }, true);

            //element.on('$destroy', () => {
            //    React.unmountComponentAtNode(element[0]);
            //});
        }
    };
});
