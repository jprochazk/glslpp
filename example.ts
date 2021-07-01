/* eslint-env node */

import { Lexer } from "./src/lexer";
import { Preprocessor } from "./src/preprocessor";

new Lexer("0x7fff").all();

const source = [
    "#version 300 es",
    "#version 300 es"
].join("\n");
console.log(new Preprocessor(source).run().tokens.map(t => t.lexeme).join(""));