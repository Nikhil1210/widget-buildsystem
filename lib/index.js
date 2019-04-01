module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(1));
// export * from './karma/karma.conf'; 


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk = __webpack_require__(2);
var fs = __webpack_require__(3);
var glob = __webpack_require__(4);
var path = __webpack_require__(5);
var webpack = __webpack_require__(6);
var awesome_typescript_loader_1 = __webpack_require__(7);
var CleanWebpackPlugin = __webpack_require__(8);
var CopyWebpackPlugin = __webpack_require__(9);
var HtmlWebpackPlugin = __webpack_require__(10);
/**
 * Generate a webpack configuration for your project
 * @param projectDir the folder of yuor project (usually `__dirname`)
 */
function webpackConfiguration(projectDir, buildEnv) {
    doLog("== Thanks for using @widget/buildsystem v" + __webpack_require__(11).version + " ==");
    doLog("bundling " + chalk.green(projectDir));
    var _a = getGetEnv(buildEnv), env = _a.env, src = _a.src;
    doLog("environment is " + chalk.green(env) + " from " + src + ")");
    var widgets = getWidgets(projectDir);
    logWidgets(widgets);
    var config = webpack.configuration = {
        devtool: getDevTool(env),
        entry: getEntry(env, widgets),
        externals: getExternals(env),
        module: getModule(projectDir, env),
        node: { __filename: true },
        output: {
            filename: "[name].js",
            path: path.resolve(projectDir, env),
            publicPath: ""
        },
        plugins: getPlugins(projectDir, env, widgets),
        resolve: {
            alias: {
                // nit neccessary unless we consume a model using 'createclass
                "create-react-class": "preact-compat/lib/create-react-class",
                "react": "pract-compat",
                "react-dom": "preact-compat",
            },
            extensions: [".tsx", ".ts", ".jsx", ".js"],
            plugins: [new awesome_typescript_loader_1.TsConfigPathsPlugin()]
        },
    };
    return config;
}
exports.webpackConfiguration = webpackConfiguration;
function buildEnvFromNodeEnv() {
    var nodeEnv = process.env.NODE_ENV;
    if (typeof nodeEnv === 'string') {
        var nodeEnvTrimmed = nodeEnv.trim();
        if (nodeEnvTrimmed === 'development' || nodeEnvTrimmed === 'test' || nodeEnvTrimmed === 'production') {
            return nodeEnvTrimmed;
        }
        else {
            return undefined;
        }
    }
    else {
        return undefined;
    }
}
function getGetEnv(buildEnv) {
    var env = buildEnv;
    var src = "parameter";
    if (!env) {
        var nodeBuilEnv = buildEnvFromNodeEnv();
        if (nodeBuilEnv) {
            env = nodeBuilEnv;
            src = "NODE_ENV";
        }
        else {
            env = "development";
            src = "default";
        }
    }
    return { env: env, src: src };
}
function getWidgets(projectDir) {
    var srcDir = path.resolve(projectDir, "src");
    var webComponentPattern = /\/src\/([^\/]*)\/\1\.tsx$/;
    var detectedWidgets = glob.sync(srcDir + "/!(common)/*.tsx").filter(function (x) { return webComponentPattern.test(x); })
        .map(function (name) {
        var sourcePath = path.resolve(name);
        var widgetPathNoExt = sourcePath.replace(/\.[^/.]+$/, "");
        var widgetName = path.basename(widgetPathNoExt);
        // find all `[widget-name].sample.html` and `[widget-name].sample.[use-case].html`
        var samples = glob.sync(widgetPathNoExt + ".sample?(.*).html").map(function (file) {
            file = path.resolve(file);
            var sampleName = file.split(".");
            return {
                htmlSampleFilename: path.basename(file),
                htmlSampleName: sampleName[sampleName.length - 2],
                htmlSamplePath: file,
                htmlSampleRelativePath: path.relative(projectDir, file),
            };
        });
        var readmes = glob.sync(path.join(path.dirname(sourcePath), "README.md"));
        var result = {
            htmlSamples: samples.sort(function (s1, s2) { return s1.htmlSampleName.localeCompare(s2.htmlSampleName); }),
            name: widgetName,
            readmes: readmes,
            sourceFound: fs.existsSync(sourcePath),
            sourcePath: sourcePath,
            sourceRelativePath: path.relative(projectDir, sourcePath),
        };
        return result;
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    return detectedWidgets;
}
function getDevTool(env) {
    switch (env) {
        case "production": return "source-map";
        case "test": return undefined;
        default: return "eval-source-map";
    }
}
function getEntry(env, widgets) {
    switch (env) {
        case "test":
            // in test mode, entries are not needed as karma-webpavk will add the test files automatically
            // remove completely the entry (to let karma-webpack manage it)
            return undefined;
        default:
            return widgets.reduce(function (acc, x) {
                return (__assign({}, acc, (_a = {}, _a[x.name] = x.sourcePath, _a)));
                var _a;
            }, {});
    }
}
function getExternals(env) {
    switch (env) {
        case "test": return { mocha: "mocha", jquery: "jQuery" }; // in test, mocha is provided by karma as a global
        default: return { jquery: "jQuery" };
    }
}
function getModule(projectDir, env) {
    var defaultModule = {
        rules: [
            {
                enforce: "pre",
                loader: "tslint-loader",
                options: {},
                test: /\.(ts|tsx)$/,
            },
            {
                loader: "awesome-typescript-loader",
                options: { configFileName: path.resolve(projectDir, "tsconfig.json") },
                test: /\.(ts|tsx)$/,
            },
            {
                test: /\.css$/,
                use: [{ loader: "css-loader", options: { modules: true } }],
            },
            {
                test: /\.less$/,
                use: [{
                        loader: "css-loader", options: { importLaoders: 1, modules: true }
                    }, { loader: "less-loader" }],
            },
        ],
    };
    switch (env) {
        case "test":// in test, we add the instrumentor for coverage reporting
            return __assign({}, defaultModule, { rules: defaultModule.rules.concat([
                    {
                        enforce: "post",
                        exculde: /(node_modules|\.spec.(ts|tsx)$)/,
                        loader: "istanbul-intrumenter-loader",
                        options: { esModules: true },
                        test: /\.(ts|tsx)$/,
                    }
                ]) });
        default: return defaultModule;
    }
}
function getPlugins(projectDir, env, widgets) {
    var defaultPlugins = [
        // TODO: uncomment when loaders/plugins we use explicitly support webpack 3
        // new (webpack.optimize as any).ModuleConcatenationPlugin(),
        new awesome_typescript_loader_1.CheckerPlugin(),
        new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify(env) })
    ].concat(widgets.map(function (w) {
        return new CopyWebpackPlugin([
            {
                flatten: true,
                from: "configuration/*.json",
                to: w.name + ".[name].[ext]",
            }
        ]);
    }));
    var generateSamples = [
        new HtmlWebpackPlugin({
            filename: "index.html",
            // a custom key (not recognized by html-webpack-plugin but used by our template)
            WidgetDescriptors: widgets,
            template: path.resolve(__dirname, "docs", "index.ejs"),
            title: "Widget Samples",
        }),
        new CopyWebpackPlugin([
            { flatten: true, from: "src/*/*.sample.html", to: "samples" },
            { context: "src", flatten: false, from: "*/README.md", to: "documentation" }
        ])
    ];
    switch (env) {
        case "test":// if no valueis provdede the sourcemapis inlined
            return defaultPlugins.concat([new webpack.SourceMapDevToolPlugin({ filename: null, test: /\.(tsx|ts|jsx|js)($|\?)/i })]);
        case "production": return defaultPlugins.concat([new CleanWebpackPlugin([path.join(projectDir, "dist"), { root: projectDir }])])
            .concat(generateSamples);
        case "development":
            return defaultPlugins.concat(generateSamples);
        default: return defaultPlugins;
    }
}
function logWidget(w) {
    var warningMsg = "WRONG NAMING";
    var blank = warningMsg.replace(/./g, " ");
    var status = w.status === "WARNING" ? chalk.yellow(warningMsg) : blank;
    var name = chalk.cyan(w.name);
    var samples = w.htmlSamples ? w.htmlSamples.map(function (s) { return s.htmlSampleName; }) : [];
    var readmes = w.readmes || [];
    doLog(name + ", samples:" + samples.length + " READMEs: " + readmes.length);
}
function logWidgets(WidgetDescriptors) {
    var validWidgetPattern = /^[a-z]+-[a-z-0-9]+$/;
    if (!WidgetDescriptors || WidgetDescriptors.length === 0) {
        return doLog("no widgets found");
    }
    var extendedWidgets = WidgetDescriptors.map(function (w) { return (__assign({}, w, { status: validWidgetPattern.test(w.name) ? "VALID" : "WARNING" })); });
    var nbWarning = extendedWidgets.filter(function (w) { return w.status === "WARNING"; }).length;
    doLog(extendedWidgets.length + " widgets found ()" + nbWarning + " warning):");
    extendedWidgets.forEach(logWidget);
}
function doLog(message) {
    var optionalParams = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        optionalParams[_i - 1] = arguments[_i];
    }
    console.log.apply(console, ["widget/buildsystem:", message].concat(optionalParams));
}


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("chalk");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("glob");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("webpack");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("awesome-typescript-loader");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("clean-webpack-plugin");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("copy-webpack-plugin");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("html-webpack-plugin");

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = {"name":"widget-buildsystem","version":"1.0.0","description":"build system to generate josting platform forweb components","main":"index.js","scripts":{"build":"webpack","test":"echo \"Error: no test specified\" && exit 1"},"keywords":["web","components","typescript"],"author":"nikhil.malhotra1210@gmail.com","license":"ISC","dependencies":{"@skatejs/bore":"^4.0.1","@skatejs/val":"^0.3.1","awesome-typescript-loader":"^3.2.3","chai":"^4.1.2","chalk":"^2.1.0","clean-webpack-plugin":"^0.1.17","commitizen":"^2.9.6","copy-webpack-plugin":"^4.1.1","cross-env":"^5.0.5","css-loader":"^0.28.7","fetch-mock":"^5.12.2","fs":"0.0.1-security","glob":"^7.1.2","html-loader":"^0.5.1","html-webpack-plugin":"^2.30.1","istanbul-instrumenter-loader":"^3.0.0","jasmine":"^2.8.0","karma":"^1.7.1","karma-chrome-launcher":"^2.2.0","less":"^2.7.2","mocha":"^4.0.0","path":"^0.12.7","preact":"^8.2.5","preact-compat":"^3.17.0","require":"^2.4.20","rimraf":"^2.6.2","semver":"^5.4.1","skatejs":"^5.0.0-beta.3","ts-node":"^3.3.0","tslint":"^5.7.0","tslint-loader":"^3.5.3","typescript":"^2.5.3","typescript-formatter":"^6.0.0","webpack":"^3.6.0","webpack-dev-server":"^2.9.1","webpack-node-externals":"^1.6.0"},"devDependencies":{"@types/node":"^8.0.33","awesome-typescript-loader":"^3.2.3"}}

/***/ })
/******/ ]);