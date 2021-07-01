/* eslint-env node */

import { Lexer } from "./src/lexer";
import { Preprocessor } from "./src/preprocessor";

new Lexer("0x7fff").all();

const source = [
    "#pragma optimize(off)",
    "#extension all : required"
].join("\n");
console.log(new Preprocessor(source).run().tokens.map(t => t.lexeme).join(""));