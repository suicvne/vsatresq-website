"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugConsole = exports.DebugSeverity = void 0;
const fs = require("fs");
var DebugSeverity;
(function (DebugSeverity) {
    /** do not set VERBOSE as a level in the Write function. */
    DebugSeverity[DebugSeverity["VERBOSE"] = 0] = "VERBOSE";
    /** these are the values you want to use. */
    DebugSeverity[DebugSeverity["DEBUG"] = 1] = "DEBUG";
    DebugSeverity[DebugSeverity["WARNING"] = 2] = "WARNING";
    DebugSeverity[DebugSeverity["ERROR"] = 3] = "ERROR";
    DebugSeverity[DebugSeverity["FATAL"] = 4] = "FATAL";
})(DebugSeverity = exports.DebugSeverity || (exports.DebugSeverity = {}));
class DebugConsole {
    static StringifyAll(args) {
        if (args.length === 1) {
            if (typeof args[0] == 'string')
                return [args[0]];
            else
                return [this.util.inspect(args[0])];
        }
        let tempArgs = [];
        args.forEach((value, index) => {
            tempArgs.push((this.util.inspect(value) === undefined ? "[undefined Object] " : this.util.inspect(value)));
        });
        return tempArgs;
    }
    static Write(level = DebugSeverity.DEBUG, ...args) {
        if (args.length === 0)
            return; //nope fuck you.
        let stringified = this.StringifyAll(args);
        let d = new Date(Date.now());
        let finalPrintLine = `[SELFSERVE ${DebugSeverity[level]}] [${d.toLocaleDateString()} ${d.toLocaleTimeString()}]: `;
        if (stringified.length === 1)
            finalPrintLine += stringified[0];
        else {
            stringified.forEach((value) => {
                d = new Date(Date.now());
                finalPrintLine += value;
            });
        }
        finalPrintLine += "\n";
        this.debugLines.push(finalPrintLine);
        process.stdout.write(finalPrintLine);
    }
    static SaveToDisk(path) {
        const storeAsJson = JSON.stringify(this.debugLines);
        DebugConsole.Writeq(`Writing debug log to disk at ${path}`);
        fs.writeFileSync(path, storeAsJson, { encoding: "utf-8" });
    }
    static GetLogs() {
        return this.debugLines;
    }
}
exports.DebugConsole = DebugConsole;
DebugConsole.util = require('util');
DebugConsole.printLevel = DebugSeverity.VERBOSE;
DebugConsole.debugLines = new Array();
DebugConsole.WriteObj = (obj) => console.log(obj);
DebugConsole.Writeq = (...args) => DebugConsole.Write(DebugSeverity.DEBUG, ...args);
//# sourceMappingURL=Debug.js.map