/**
 * About Interactive.ts
 * Simple built-in interactive TypeScript Console.
 * 
 * Created 2/8/19
 * (C) Ignore Solutions
 * 
 * DO NOT REDISTRIBUTE!!
 */


import * as ts from 'typescript'
import { DebugConsole, DebugSeverity } from "./Debug";

import {ServerAuth} from './BlogBackend_Mongo';

const vm = require('vm')

export class InteractiveConsole {
    private stdin: any = undefined;
    private EvalContext: any = {
        printState: () => console.log(this.EvalContext),
        buildFunction: (infunction: any, funcName: string) => {
            if(infunction !== undefined)    this.EvalContext[funcName] = infunction;
        },
        require: () => {/**u tried */},
        console: console,
        exit: () => process.exit(0),
        decrypt: (input: any) => {
            return ServerAuth.decryptText(input);
        },
        encrypt: (input: any) => {
            return ServerAuth.encryptText(input);
        }
    };

    public inputIndicator: string = "\n> ";
    public lastErr: any = undefined;


    public executeTSCode(input: string): string {
        let transpileResult: ts.TranspileOutput = ts.transpileModule(input, {
            compilerOptions: { module: ts.ModuleKind.ESNext }
        });
        try
        {
            let evalResult = vm.runInContext(transpileResult.outputText, this.EvalContext);
            if(evalResult !== undefined)    DebugConsole.Writeq("EVAL:", evalResult);
            return evalResult;
        }
        catch(err) {
            console.log(err);
            this.lastErr = err;
            return "";
        }
    }

    constructor() {
        vm.createContext(this.EvalContext);
        this.stdin = process.openStdin();

        this.stdin.addListener("data", (d: any) => {
            if(d !== undefined)
            {
                let asStr = String(d).trim();
                
                if(asStr.trim()) //checks for empty strings
                {
                    if(this.executeTSCode(asStr) === "")
                        DebugConsole.Write(DebugSeverity.ERROR, `Error while evaluating given TS: ${asStr}`);
                    process.stdout.write(this.inputIndicator);
                }
                else
                    process.stdout.write(this.inputIndicator);
            }
        });

        process.stdout.write(this.inputIndicator);
    }
}