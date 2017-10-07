import * as chalk from 'chalk';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as webpack from 'webpack';
import {CheckerPlugin, TsConfigPathsPlugin} from 'awesome-typescript-loader';
import * as CleanWebpackPlugin from 'clean-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';

export type WidgetBuildEnv = 
"development" // default webpack server mainly. Includes full inline sourecmaps and sample pages
| "test" // like development but withoutthe sample pages
| "production" // minified, externalised full sourcemaps and the sample pages

interface IWidgetSampleDescription{
    htmlSampleFilename: string;
    htmlSampleName: string;
    htmlSamplePath:string;
    htmlSampleRelativePath:string;
}
interface IWidgetDescriptor{
    name: string;
    sourcePath: string;
    sourceRelativePath: string;
    sourceFound: boolean;
    htmlSamples: IWidgetSampleDescription[];
    readmes: string[];
}

/**
 * Generate a webpack configuration for your project
 * @param projectDir the folder of yuor project (usually `__dirname`)
 */
export function webpackConfiguration(projectDir: string, buildEnv?:WidgetBuildEnv){
    doLog(`== Thanks for using @widget/buildsystem v${require("../../package.json").version} ==`);
    doLog(`bundling ${chalk.green(projectDir)}`);

    const {env, src} = getGetEnv(buildEnv);
doLog(`environment is ${chalk.green(env)} from ${src})`);
const widgets = getWidgets(projectDir);
logWidgets(widgets);
const config = webpack.configuration={
    devtool: getDevTool(env),
    entry: getEntry(env, widgets),
    externals: getExternals(env),
    module: getModule(projectDir, env),
    node: {__filename: true},     
    output:{
        filename:"[name].js",
        path: path.resolve(projectDir, env),
        publicPath: ""}     
}, 
    plugins: getPlugins(projectDir, any, widgets),
    resolve:{
        alias: {
            // nit neccessary unless we consume a model using 'createclass
            "create-react-class": "preact-compat/lib/create-react-class",
            "react": "pract-compat",
            "react-dom": "preact-compat",
        },
        extensions: [".tsx", ".ts", ".jsx", ".js"],
        plugins: [new TsConfigPathsPlugin()]
    },
};

return config;
}
function buildEnvFromNodeEnv(): WidgetBuildEnv | undefined
{
    const nodeEnv = process.env.NODE_ENV
    if(typeof nodeEnv=== 'string'){
        const nodeEnvTrimmed = nodeEnv.trim();
        if(nodeEnvTrimmed === 'development' || nodeEnvTrimmed === 'test' || nodeEnvTrimmed === 'production'){
           return nodeEnvTrimmed; 
        }else{
            return undefined;
        }
    }else{
        return undefined;
    }
}

function getGetEnv(buildEnv?: WidgetBuildEnv): {env: WidgetBuildEnv, src: string}{
    let env = buildEnv;
    let src = "parameter";
    if(!env){
        const nodeBuilEnv = buildEnvFromNodeEnv();
        if(nodeBuilEnv){
            env= nodeBuilEnv;
            src = "NODE_ENV";
        }else{
            env = "development";
            src = "default";
        }
    }
    return {env, src};
}

function getWidgets(projectDir: string){
    const srcDir = path.resolve(projectDir, "src");
    const webComponentPattern = /\/src\/([^\/]*)\/\1\.tsx$/;
    const detectedWidgets = IWidgetDescriptor[] = glob.sync(`${srcDir}/!(common)/*.tsx`).filter((x)=> webComponentPattern.test(x))
    .map((name) => {
        const sourcePath = path.resolve(name);
        const widgetPathNoExt = sourcePath.replace(/\.[^/.]+$/,"");
        const widgetName = path.basename(widgetPathNoExt);
        // find all `[widget-name].sample.html` and `[widget-name].sample.[use-case].html`
        const samples = glob.sync(`${widgetPathNoExt}.sample?(.*).html`).map((file) => {
            file = path.resolve(file);
            const sampleName = file.split(".");
            return {
                htmlSampleFilename: path.basename(file),
                htmlSampleName: sampleName[sampleName.length - 2],
                htmlSamplePath: file,
                htmlSampleRelativePath: path.relative(projectDir, file),
            };
        });
        const readmes = glob.sync(path.join(path.dirname(sourcePath), "README.md"));
        const result: IWidgetDescriptor ={
            htmlSamples: samples.sort((s1,s2) =>s1.htmlSampleName.localeCompare(s2.htmlSampleName)),
            name: widgetName,
            readmes,
            sourceFound: fs.existsSync(sourcePath),
            sourcePath,
            sourceRelativePath: path.relative(projectDir, sourcePath),
        };
        return result;
    }).sort((a,b) => a.name.localeCompare(b.name));
    return detectedWidgets;
}

function getDevTool(env: WidgetBuildEnv){
    switch(env){
        case "production":  return "source-map";
        case "test": return undefined;
        default: return "eval-source-map";
    }
}
function getEntry(env: WidgetBuildEnv, widgets: IWidgetDescriptor[]){
    switch(env){
        case "test":
        // in test mode, entries are not needed as karma-webpavk will add the test files automatically
        // remove completely the entry (to let karma-webpack manage it)
        return undefined;

        default:
        return widgets.reduce((acc, x) => ({...acc, [x.name]: x.sourcePath}), {} as webpack.Entry);
    }
}

function getExternals(env: WidgetBuildEnv){
    switch(env){
        case "test": return {mocha : "mocha", jquery: "jQuery"}; // in test, mocha is provided by karma as a global
        default: return {jquery: "jQuery"};
    }
}

function getModule(projectDir: string,env: WidgetBuildEnv){
    const defaultModule: webpack.NewModule= {
        rules: [
            {
                enforce: "pre",
                loader: "tslint-loader",
                options: { /* Loader options go here*/},
                test: /\.(ts|tsx)$/,
            },
            {
                loader: "awesome-typescript-loader",
                options: {configFileName: path.resolve(projectDir, "tsconfig.json")},
                test: /\.(ts|tsx)$/,
            },
            {
                test: /\.css$/,
                use: [{loader: "css-loader", options: {modules: true}}],
            },
            {
                test: /\.less$/,
                use:[{
                    loader: "css-loader", options:{importLaoders:1, modules: true}
                }, {loader: "less-loader"}],
            },
        ],
    };

switch(env){
    case "test": // in test, we add the instrumentor for coverage reporting
    return {
        ...defaultModule,
        rules: defaultModule.rules.concat([
            {
                enforce: "post",
                exculde: /(node_modules|\.spec.(ts|tsx)$)/, // do not instrument nde_modules and test files
                loader: "istanbul-intrumenter-loader",
                options: {esModules: true},
                test: /\.(ts|tsx)$/,
            }
        ]),
    };
    default: return defaultModule;
}
}
function getPlugins(projectDir: string, env: WidgetBuildEnv, widgets: IWidgetDescriptor[]){
    const defaultPlugins= [
    // TODO: uncomment when loaders/plugins we use explicitly support webpack 3
    // new (webpack.optimize as any).ModuleConcatenationPlugin(),
    new CheckerPlugin(),
    new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify(env)}),
    ...widgets.map((w) =>{
        return new CopyWebpackPlugin([
            {
                flatten: true,
                from: "configuration/*.json",
                to: `${w.name}.[name].[ext]`,
            }
        ]);
    }),
    ];
const generateSamples = [
    new HtmlWebpackPlugin({
        filename: "index.html",
        // a custom key (not recognized by html-webpack-plugin but used by our template)
        WidgetDescriptors: widgets,
        template: path.resolve(__dirname, "docs", "index.ejs"),
        title: "Widget Samples",
    }),
    new CopyWebpackPlugin([
        {flatten: true, from : "src/*/*.sample.html", to: "samples"},
        {context: "src", flatten: false, from :"*/README.md", to:"documentation"}
    ])
];
switch(env){
    case "test":// if no valueis provdede the sourcemapis inlined
    return defaultPlugins.concat([new webpack.SourceMapDevToolPlugin({filename:null, test: /\.(tsx|ts|jsx|js)($|\?)/i})]);

    case "production": return defaultPlugins.concat([new CleanWebpackPlugin([path.join(projectDir, "dist"), {root: projectDir}])])
    .concat(generateSamples);
    case "development":
    return defaultPlugins.concat(generateSamples);
    default:return defaultPlugins;
}

}
function logWidget(w: IWidgetDescriptor & {status: "VALID" | "WARNING" }){
    const warningMsg= "WRONG NAMING";
    const blank = warningMsg.replace(/./g, " ");
    const status = w.status === "WARNING" ? chalk.yellow(warningMsg): blank;
    const name: chalk.cyan(w.name);
    const samples = w.htmlSamples ? w.htmlSamples.map((s) => s.htmlSampleName):[];
    const readmes = w.readmes || [];
    doLog(`${name}, samples:${samples.length} READMEs: ${readmes.length}`);
}
 function logWidgets(WidgetDescriptors: IWidgetDescriptor[]){
     const validWidgetPattern = /^[a-z]+-[a-z-0-9]+$/;
     if(!WidgetDescriptors || WidgetDescriptors.length ===0){
         return doLog(`no widgets found`);
     }
        const extendedWidgets = WidgetDescriptors.map((w) => ({
            ...w, status:validWidgetPattern.test(w.name) ? "VALID":"WARNING",
        }));
        const nbWarning = extendedWidgets.filter((w) => w.status === "WARNING").length;
        doLog(`${extendedWidgets.length} widgets found ()${nbWarning} warning):`);

        extendedWidgets.forEach(logWidget);
 }
function doLog(message: any, ...optionalParams: any[]){
    console.log("widget/buildsystem:", message, ...optionalParams);
    
}