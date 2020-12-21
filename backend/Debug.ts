import fs = require('fs');

export enum DebugSeverity {
    /** do not set VERBOSE as a level in the Write function. */
    VERBOSE = 0,

    /** these are the values you want to use. */
    DEBUG = 1,
    WARNING,
    ERROR,
    FATAL
}

export class DebugConsole {
    private static util = require('util');

    private static printLevel: DebugSeverity = DebugSeverity.VERBOSE;
    private static debugLines: string[] = new Array<string>();

    public static WriteObj = (obj: any) => console.log(obj);

    public static Writeq = (...args: any[]) => DebugConsole.Write(DebugSeverity.DEBUG, ...args);

    private static StringifyAll(args: any[]): string[] {
        if(args.length === 1)   
        {
            if(typeof args[0] == 'string') return [ args[0] ];
            else return [ this.util.inspect(args[0]) ];
        }

        let tempArgs: string[] = [];
        args.forEach((value: any, index: number) => {
            tempArgs.push((this.util.inspect(value) === undefined ? "[undefined Object] " : this.util.inspect(value)));
        });

        return tempArgs;
    }

    public static Write(level: DebugSeverity = DebugSeverity.DEBUG, ...args: any[]): void {
        if(args.length === 0) return; //nope fuck you.
        let stringified: string[] = this.StringifyAll(args);

        let d: Date = new Date(Date.now());
        let finalPrintLine: string = `[SELFSERVE ${DebugSeverity[level]}] [${d.toLocaleDateString()} ${d.toLocaleTimeString()}]: `;
        
        if(stringified.length === 1) finalPrintLine += stringified[0];
        else 
        {
            stringified.forEach((value: string) => {
                d = new Date(Date.now());
                finalPrintLine += value;
            });
        }

        finalPrintLine += "\n";

        this.debugLines.push(finalPrintLine);
        process.stdout.write(finalPrintLine);
    }

    public static SaveToDisk(path: string) {
        const storeAsJson: string = JSON.stringify(this.debugLines);
        DebugConsole.Writeq(`Writing debug log to disk at ${path}`);
        fs.writeFileSync(path, storeAsJson, {encoding: "utf-8"});
    }
    
    public static GetLogs(): string[] {
        return this.debugLines;
    }
}