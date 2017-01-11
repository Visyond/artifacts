import { Converter } from "./converter/index";
import { Renderer } from "./output/renderer";
import { ProjectReflection } from "./models/index";
import { Logger, PluginHost } from "./utils/index";
import { AbstractComponent, ChildableComponent } from "./utils/component";
import { Options, IOptionsReadResult } from "./utils/options/index";
export declare class Application extends ChildableComponent<Application, AbstractComponent<Application>> {
    options: Options;
    converter: Converter;
    renderer: Renderer;
    logger: Logger;
    plugins: PluginHost;
    loggerType: string | Function;
    ignoreCompilerErrors: boolean;
    exclude: string;
    static VERSION: string;
    constructor(options?: Object);
    protected bootstrap(options?: Object): IOptionsReadResult;
    readonly application: Application;
    readonly isCLI: boolean;
    getTypeScriptPath(): string;
    getTypeScriptVersion(): string;
    convert(src: string[]): ProjectReflection;
    generateDocs(src: string[], out: string): boolean;
    generateDocs(project: ProjectReflection, out: string): boolean;
    generateJson(src: string[], out: string): boolean;
    generateJson(project: ProjectReflection, out: string): boolean;
    expandInputFiles(inputFiles?: string[]): string[];
    toString(): string;
}
