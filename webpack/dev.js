
var applyCommonConfig = require("./common").applyCommonConfig;

module.exports = applyCommonConfig({
    entry: {
        "tests": "./test/main.js",
        "demos/basic": "./demos/basic/main.js",
        "demos/extremes": "./demos/extremes/main.js",
        "demos/angular-directive": "./demos/angular-directive/main.js",
        "demos/commonjs": "./demos/commonjs/main.js"
    },
    output: {
        path: "./build/",
        filename: "[name].js"
    }
});
