import * as path from 'path';
import * as webpack from 'webpack';
import * as CleanWebpackPlugin from 'clean-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';

const webpackNodeExternals = require('webpack-node-externals');
const config : webpack.Configuration = {
    entry:{
        index: "./src/index.ts",
    },
    externals: [webpackNodeExternals()],
    module: {
        rules: [
            {
                enforce:"pre",
                loader: "tslint-loader",
                test: /\.ts$/
            },
            {
                loader: "awesome-typescript-loader",
                test: /\.(ts|tsx)$/
            }
        ],
    },
    node: {
        __dirname: false
    },
    output: {
        filename: "index.js",
        libraryTarget: "commonjs2",
        path: path.resolve(__dirname,"lib"),
    },
    plugins:[
        new CleanWebpackPlugin(["lib"]),
        new CopyWebpackPlugin([
            {from :path.join(__dirname, "src", "webpack", "docs"), to: "docs"},
            {from :path.join(__dirname, "src", "karma", "vendors"), to: "vendors"}
        ]),
    ],
    resolve: {
        extensions: [".ts", ".js"]
    },
    target: "node",
};
export default config;