module.exports = {
    entry: {
        "tests": "./test/main.js",
        "demos/basic": "./demos/basic/main.js",
        "demos/angular-directive": "./demos/angular-directive/main.js"
    },
    output: {
        path: "./build/",
        filename: "[name].js"
    },
    module: {
        loaders: [
            {
                test: /\.less$/,
                loader: "style!css!less"
            },
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel"
            }
        ]
    }
};
