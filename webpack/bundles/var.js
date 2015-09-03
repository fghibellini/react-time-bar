
var applyCommonConfig = require("../common").applyCommonConfig;

module.exports = applyCommonConfig({
    entry: {
        "component": ["./src/component.js"], // in array because of https://github.com/webpack/webpack/issues/300
        "angular-directive": "./src/angular-directive.js"
    },
    output: {
        path: "./dist",
        filename: "[name].var.js",

        libraryTarget: "var",
        library: "ReactTimeBar"
    },
    externals: {
        react: "React",
        rx: "Rx",
        "rx-dom": "Rx.DOM",
        angular: "angular"
    }
});
