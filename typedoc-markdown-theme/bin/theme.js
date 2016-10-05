var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var td = require('typedoc');
var Handlebars = require('handlebars');
/**
* Markdown theme implementation of TypeDoc.
*/
var MarkdownTheme = (function (_super) {
    __extends(MarkdownTheme, _super);
    /**
    * Create a new MarkdownTheme instance.
    *
    * @param renderer  The renderer this theme is attached to.
    * @param basePath  The base path of this theme.
    */
    function MarkdownTheme(renderer, basePath) {
        _super.call(this, renderer, basePath);
        renderer.removePlugin('assets'); // markdown doesn't need assets
        renderer.removePlugin('javascriptIndex'); // markdown doesn't need search.js
        renderer.removePlugin('prettyPrint'); // new lines and spaces have meaning in markdown, don't omit them automatically!
        Handlebars.registerHelper('newLine', function () { return '\n'; });
    }
    MarkdownTheme.prototype.func = function (arg, f) {
        return arg;
    };
    MarkdownTheme.prototype.isOutputDirectory = function (path) {
        return td.FS.existsSync(td.Path.join(path, 'index.md'));
    };
    MarkdownTheme.prototype.getUrls = function (project) {
        /**
        * Replace the extensions of the given model and its descendants' url
        *
        * @param model
        */
        function replaceModelUrlExtention(model) {
            if (!model) {
                return;
            }
            model.url = MarkdownTheme.replaceExtention(model.url);
            model.children && model.children.forEach(replaceModelUrlExtention);
        }
        return _super.prototype.getUrls.call(this, project).map(function (urlMapping) {
            replaceModelUrlExtention(urlMapping.model);
            return new td.output.UrlMapping(MarkdownTheme.replaceExtention(urlMapping.url), urlMapping.model, urlMapping.template);
        });
    };
    MarkdownTheme.prototype.getNavigation = function (project) {
        /**
        * Replace the extentions of paths held by the given navigation and its descendants.
        *
        * @param navigation The target navigation instance.
        */
        function replaceNavigationExtention(navigation) {
            navigation.url = MarkdownTheme.replaceExtention(navigation.url);
            if (navigation.dedicatedUrls) {
                navigation.dedicatedUrls = navigation.dedicatedUrls.map(MarkdownTheme.replaceExtention);
            }
            navigation.children && navigation.children.forEach(replaceNavigationExtention);
        }
        var navigation = _super.prototype.getNavigation.call(this, project);
        replaceNavigationExtention(navigation);
        return navigation;
    };
    /**
    * Replace the extension of the path from html to md
    *
    * @param path The original path to be replaced.
    * @returns    The replaced path.
    * @private
    */
    MarkdownTheme.replaceExtention = function (path) {
        return path ? path.replace(/\.html($|#.*$)/, '.md$1') : path;
    };
    return MarkdownTheme;
})(td.output.DefaultTheme);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MarkdownTheme;
