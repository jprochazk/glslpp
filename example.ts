/* eslint-env node */

import { Lexer } from "./src/lexer";

const source = [
    "#define PI 3.1415926",
].join("\n");
console.log([...new Lexer(source)].map(t => t.toString()));
/* for (const token of new Lexer(source)) {
    console.log(token.kind, token.lexeme, token.error ? token.error : "");
} */
