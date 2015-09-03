
var applyCommonConfig = require("../common").applyCommonConfig;

module.exports = applyCommonConfig({
    entry: {
        "component": ["./src/component.js"], // in array because of https://github.com/webpack/webpack/issues/300
        "angular-directive": "./src/angular-directive.js"
    },
    output: {
        path: "./dist",
        filename: "[name].amd.js",

        libraryTarget: "amd",
        library: "react-time-bar"
    },
    externals: {
        react: "react",
        rx: "rx",
        "rx-dom": "rx-dom",
        angular: "angular"
    }
});
