var path = require('path');
var webpack = require("webpack");


module.exports = {
    recordsPath: path.join(__dirname, '.webpack.cache'),
    context: __dirname,
    entry: {
        'graph': './graph',
    },
    output: {
        pathinfo: true,
        path: __dirname,
        filename: "bundled-[name].js",
    },
};
