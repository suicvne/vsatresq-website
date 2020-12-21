"use strict";
/**
 * About Interactive.ts
 * Simple built-in interactive TypeScript Console.
 *
 * Created 2/8/19
 * (C) Ignore Solutions
 *
 * DO NOT REDISTRIBUTE!!
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractiveConsole = void 0;
const ts = __importStar(require("typescript"));
const Debug_1 = require("./Debug");
const vm = require('vm');
class InteractiveConsole {
    constructor() {
        this.stdin = undefined;
        this.EvalContext = {
            printState: () => console.log(this.EvalContext),
            buildFunction: (infunction, funcName) => {
                if (infunction !== undefined)
                    this.EvalContext[funcName] = infunction;
            },
            require: () => { },
            console: console,
            dbg_n: () => {
                let a = require('./TokenStore');
                return a.getNonce();
            },
            exit: () => process.exit(0),
            decrypt: (input) => {
                let a = require('./BlogBackend_Mongo');
                return a.decryptText(input);
            },
            encrypt: (input) => {
                let a = require('./BlogBackend_Mongo');
                return a.encryptText(input);
            }
        };
        this.inputIndicator = "\n> ";
        this.lastErr = undefined;
        vm.createContext(this.EvalContext);
        this.stdin = process.openStdin();
        this.stdin.addListener("data", (d) => {
            if (d !== undefined) {
                let asStr = String(d).trim();
                if (asStr.trim()) //checks for empty strings
                 {
                    if (this.executeTSCode(asStr) === "")
                        Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, `Error while evaluating given TS: ${asStr}`);
                    process.stdout.write(this.inputIndicator);
                }
                else
                    process.stdout.write(this.inputIndicator);
            }
        });
        process.stdout.write(this.inputIndicator);
    }
    executeTSCode(input) {
        let transpileResult = ts.transpileModule(input, {
            compilerOptions: { module: ts.ModuleKind.ESNext }
        });
        try {
            let evalResult = vm.runInContext(transpileResult.outputText, this.EvalContext);
            if (evalResult !== undefined)
                Debug_1.DebugConsole.Writeq("EVAL:", evalResult);
            return evalResult;
        }
        catch (err) {
            console.log(err);
            this.lastErr = err;
            return "";
        }
    }
}
exports.InteractiveConsole = InteractiveConsole;
//# sourceMappingURL=Interactive.js.map