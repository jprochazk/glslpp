import { Token, __Kind } from "./token";
import { Lexer } from "./lexer";

interface Macro {
    /** Params of a function-like macro */
    params?: string[],
    /** Macro body */
    body?: Token[],
}

const ESCAPED_NEWLINE_REGEX = /\\\n/g;

// Implemented according to behavior described in https://gcc.gnu.org/onlinedocs/gcc-2.95.3/cpp_1.html,
// minus GNU extensions, and everything to do with characters/strings

export class Preprocessor {
    readonly source: string;

    private tokens: Token[];
    private output: Token[];
    private cursor: number;

    private errors: Preprocessor.Error[];

    private macros: Record<string, Macro>;

    // TODO: store cond values + ignore branch *only if every previous branch was false*.
    // ignored branches values' should be set to false, so that they are actually ignored
    private condStack: { kind: "if" | "elif" | "else", value: boolean }[];

    constructor(
        source: string,
        defines: string[] = [],
    ) {
        this.source = source;

        this.tokens = [];
        this.output = [];
        this.cursor = 0;
        this.errors = [];
        this.macros = Object.fromEntries(defines.map((name) => [name, {}]));
        this.condStack = [];
    }

    run(): Preprocessor.Output {
        const source = this.source.replace(ESCAPED_NEWLINE_REGEX, "");
        this.tokens = new Lexer(source).all();

        // the preprocessor goes through one line at a time
        // whitespace is significant, because a directive is terminated by '\n'
        while (!this.done()) try {
            this.line();
        } catch (error: unknown) {
            if (error instanceof Preprocessor.Error) {
                (this.errors as Preprocessor.Error[]).push(error);
                // skip until newline
                while (!this.done() && !this.match(__Kind.NewLine)) this.advance();
            } else {
                throw error;
            }
        }

        if (this.condStack.length !== 0) {
            // TODO: store origin token with each cond in cond stack, then iterate in reverse and find the first '#if',
            // use its token to construct this error
            (this.errors as Preprocessor.Error[]).push(new Preprocessor.Error(null, "Unterminated '#if' block"));
        }

        return {
            tokens: this.output,
            errors: this.errors,
        };
    }

    private line() {
        const lineStart = this.cursor;
        this.skip(__Kind.Whitespace);
        if (this.match(__Kind.Hash)) return this.directive();
        // we didn't find a directive, continue until done or newline
        // then push all the tokens into output if we aren't ignoring
        // this part of the code due to conditional compilation
        if (this.ignore()) {
            while (!this.done() && !this.match(__Kind.NewLine)) this.advance();
        } else {
            for (let pos = lineStart; pos < this.cursor; ++pos)
                this.output.push(this.tokens[pos]!);

            while (!this.done()) {
                const token = this.advance();
                if (token) {
                    if (token.kind === __Kind.Identifier && token.lexeme in this.macros) {
                        this.output.push(...this.expand(token, [token.lexeme]));
                    } else if (token.kind === __Kind.NewLine) {
                        this.output.push(token);
                        break;
                    } else this.output.push(token);
                }
            }
        }
    }

    /**
     * @param ident macro to expand
     * @param expansionStack stack of macros that are currently being recursively expanded, used to avoid indirect self-references
     */
    private expand(ident: Token, expansionStack: string[]): Token[] {
        const macro = this.macros[ident.lexeme]!;
        // empty body doesn't default to anything
        if (!macro.body) return [];
        if (macro.params) {
            // macro invocation?
            const skippedWhitespace = this.match(__Kind.Whitespace);
            if (this.match(__Kind.LeftParen)) {
                // expand args
                let parens = 1;
                const args = [];
                do {
                    // if a call to a macro that requires at least one argument does not contain
                    // at least some whitespace, then it is an error according to the C standard
                    // but Chrome's GLSL preprocessor doesn't consider this an error
                    // TODO: which should I follow?
                    /* if (this.check(__Kind.RightParen)) break;
                    else this.skip(__Kind.Whitespace); */

                    this.skip(__Kind.Whitespace);

                    const argTokens = [];
                    while (!this.done() && (parens > 1 || !this.check(__Kind.Comma)) && parens !== 0) {
                        const token = this.advance();
                        if (token) {
                            if (token.kind === __Kind.LeftParen) parens += 1;
                            else if (token.kind === __Kind.RightParen) parens -= 1;
                            else if (token.kind === __Kind.Identifier && token.lexeme in this.macros) {
                                expansionStack.push(token.lexeme);
                                argTokens.push(...this.expand(token, expansionStack));
                                expansionStack.pop();
                                continue;
                            }
                            if (parens > 0) argTokens.push(token);
                        }
                    }
                    args.push(argTokens);
                } while (this.match(__Kind.Comma));
                // TODO: better error in this case, maybe highlight which parenthesis is unclosed
                if (parens !== 0) throw new Preprocessor.Error(this.previous(), `Missing ${parens} closing ')'`);

                if (args.length !== macro.params.length) {
                    throw new Preprocessor.Error(ident, `${args.length > macro.params.length ? "Too many" : "Not enough"} params to invoke macro`);
                }

                // substitute args in body
                let substituted: Token[];
                {
                    const write = [];
                    for (const token of [...macro.body]) {
                        const index = macro.params.indexOf(token.lexeme);
                        if (index !== -1) {
                            write.push(...args[index]);
                        } else {
                            write.push(token);
                        }
                    }
                    substituted = write;
                }
                return this.expandBody(ident, expansionStack, substituted);
            } else {
                if (skippedWhitespace)
                    return [ident, this.previous()!];
                return [ident];
            }
        } else {
            return this.expandBody(ident, expansionStack, [...macro.body]);
        }
    }

    private expandBody(self: Token, expansionStack: string[], body: Token[]): Token[] {
        // `body` is expanded by pushing all tokens from `read` into `write`,
        // and if any identifier token in `read` is a macro, then that identifier
        // is expanded, and all the resulting tokens are pushed into `write`

        // once all tokens from `read` have been read, the buffers are swapped,
        // and the process repeats until there are no more macros to expand

        let write: Token[] = [];
        let read: Token[] = body;

        // store the previous token list + cursor on the stack,
        // because we want all the utils (advance, check, done, match, etc.)
        // to work in the context of `body`
        const prevTokens = this.tokens;
        const prevCursor = this.cursor;
        this.tokens = read;
        this.cursor = 0;

        let foundMacro = false;
        while (true) {
            while (!this.done()) {
                const token = this.advance();
                if (token) {
                    // macro isn't expanded if it is a self-reference,
                    // e.g. '#define A A' doesn't go into an infinite loop, and expands to 'A'
                    // indirect self-references also don't cause infinite recursion:
                    // '#define B A', '#define A B', 'A' would expand to 'A' and 'B' would expand to 'B'
                    if (token.kind === __Kind.Identifier && token.lexeme in this.macros && !expansionStack.includes(token.lexeme)) {
                        expansionStack.push(token.lexeme);
                        write.push(...this.expand(token, expansionStack));
                        expansionStack.pop();
                        foundMacro = true;
                    } else {
                        write.push(token);
                    }
                }
            }
            // swap read/write and reset write
            const temp = this.tokens;
            this.tokens = write;
            this.cursor = 0;
            write = temp;
            write.length = 0;
            if (!foundMacro || this.done()) break;
            else foundMacro = false;
        }

        read = this.tokens;
        this.tokens = prevTokens;
        this.cursor = prevCursor;
        return read;
    }

    private directive() {
        // /\s[a-zA-Z_][a-zA-Z_0-9]*/
        this.skip(__Kind.Whitespace);
        if (this.match(__Kind.Identifier)) {
            const name = this.previous()!.lexeme;
            switch (name) {
                case "define": return this.define();
                case "undef": return this.undef();
                case "if": return this.if();
                case "ifdef": return this.ifdef();
                case "ifndef": return this.ifndef();
                case "else": return this.else();
                case "elif": return this.elif();
                case "endif": return this.endif();
                case "error": return this.error();
                case "pragma": return this.pragma();
                case "extension": return this.extension();
                case "line": {
                    while (!this.done() && !this.match(__Kind.NewLine)) this.advance();
                    return;
                }
            }
        }
        // empty directive, skip the whole line
        while (!this.done() && !this.match(__Kind.NewLine)) this.advance();
    }

    private define() {
        this.skip(__Kind.Whitespace);
        const name = this.consume(__Kind.Identifier, "Expected identifier");

        if (name.lexeme in this.macros) {
            throw new Preprocessor.Error(name, "Attempted to re-define macro");
        }

        let params: string[] | undefined;
        if (this.match(__Kind.LeftParen)) {
            // function-like
            this.skip(__Kind.Whitespace);
            params = [];
            if (!this.check(__Kind.RightParen)) {
                do {
                    this.skip(__Kind.Whitespace);
                    params.push(this.consume(__Kind.Identifier, "Expected identifier").lexeme);
                    this.skip(__Kind.Whitespace);
                } while (this.match(__Kind.Comma));
            }
            this.consume(__Kind.RightParen, "Expected closing ')'");
        }

        this.skip(__Kind.Whitespace);
        const spanStart = this.cursor;
        let hadNewLine = false;
        while (!this.done() && (hadNewLine = this.match(__Kind.NewLine), !hadNewLine)) this.advance();
        // if present, skip the newline
        const spanEnd = this.cursor - (hadNewLine ? 1 : 0);
        let body: Token[] | undefined;
        if (spanEnd - spanStart > 0) {
            body = this.tokens.slice(spanStart, spanEnd);
        }

        const macro: Macro = {};
        if (params) macro.params = params;
        if (body) macro.body = body;
        this.macros[name.lexeme] = macro;
    }

    private undef() {
        // TODO: it's an error to undefine built-ins
        this.skip(__Kind.Whitespace);
        const name = this.consume(__Kind.Identifier, "Expected identifier").lexeme;
        delete this.macros[name];

        while (!this.done() && !this.match(__Kind.NewLine)) this.advance();
    }

    private if() {
        this.skip(__Kind.Whitespace);
        const value = this.constExpr();
        this.condStack.push({ kind: "if", value });
    }

    private ifdef() {
        this.skip(__Kind.Whitespace);
        const name = this.consume(__Kind.Identifier, "Expected identifier");
        const value = name.lexeme in this.macros;
        this.condStack.push({ kind: "if", value });
    }

    private ifndef() {
        this.skip(__Kind.Whitespace);
        const name = this.consume(__Kind.Identifier, "Expected identifier");
        const value = !(name.lexeme in this.macros);
        this.condStack.push({ kind: "if", value });
    }

    private ignoreBranch(): boolean {
        for (let i = this.condStack.length - 1; i >= 0; --i) {
            if (this.condStack[i].value) return true;
            if (this.condStack[i].kind === "if") break;
        }
        return false;
    }

    private elif() {
        this.skip(__Kind.Whitespace);
        const prevCond = this.condStack[this.condStack.length - 1];
        if (prevCond) {
            if (prevCond.kind !== "else") {
                const value = this.constExpr() && !this.ignoreBranch();
                this.condStack.push({ kind: "elif", value });
            } else {
                throw new Preprocessor.Error(this.previous(), `Unexpected '#elif' after '#else'`);
            }
        } else {
            throw new Preprocessor.Error(this.previous(), `Unexpected '#elif' before '#if'`);
        }
    }

    private else() {
        while (!this.done() && !this.match(__Kind.NewLine)) this.advance();
        const prevCond = this.condStack[this.condStack.length - 1];
        if (prevCond) {
            if (prevCond.kind !== "else") {
                const value = !this.ignoreBranch();
                this.condStack.push({ kind: "else", value });
            } else {
                throw new Preprocessor.Error(this.previous(), `Unexpected '#else' after '#else'`);
            }
        } else {
            throw new Preprocessor.Error(this.previous(), `Unexpected '#else' before '#if'`);
        }
    }

    private endif() {
        while (!this.done() && !this.match(__Kind.NewLine)) this.advance();
        if (this.condStack.length === 0)
            throw new Preprocessor.Error(this.previous(), `Unexpected '#endif' before '#if'`);
        while (true) {
            const cond = this.condStack.pop();
            if (cond?.kind === "if") break;
        }
    }

    private constExpr(): boolean {
        this.skip(__Kind.Whitespace);
        const exprTokens = [];
        while (!this.done() && !this.match(__Kind.NewLine)) {
            const token = this.advance()!;
            if (token.kind === __Kind.Identifier) {
                if (!(token.lexeme in this.macros)) throw new Preprocessor.Error(token, "Undefined identifier");
                const expanded = this.expand(token, [token.lexeme]);
                for (const token of expanded)
                    if (token.kind !== __Kind.Whitespace)
                        exprTokens.push(token);
            }
            else if (token.kind !== __Kind.Whitespace) {
                exprTokens.push(token);
            }
        }

        const prevTokens = this.tokens;
        const prevCursor = this.cursor;
        this.tokens = exprTokens;
        this.cursor = 0;

        const value = this.eval(this.expression()) !== 0;

        this.tokens = prevTokens;
        this.cursor = prevCursor;
        return value;
    }

    private expression(): Expr {
        return this.or();
    }
    private eval(expr: Expr): number {
        switch (expr.kind) {
            case ExprKind.Value: return expr.value;
            case ExprKind.Binary: return op.binary[expr.op](this.eval(expr.left), this.eval(expr.right));
            case ExprKind.Unary: return op.unary[expr.op](this.eval(expr.right));
            case ExprKind.Logical: {
                if (expr.op === LogicalOp.And) {
                    const left = this.eval(expr.left);
                    if (left !== 0) return this.eval(expr.right);
                    else return left;
                }
                else /* expr.op === LogicalOp.Or */ {
                    const left = this.eval(expr.left);
                    if (left === 0) return this.eval(expr.right);
                    else return left;
                }
            }
        }
    }

    private or(): Expr {
        let left = this.and();
        while (this.match(__Kind.PipePipe)) {
            const right = this.and();
            left = { kind: ExprKind.Logical, left, op: LogicalOp.Or, right };
        }
        return left;
    }

    private and(): Expr {
        let left = this.bitor();
        while (this.match(__Kind.AndAnd)) {
            const right = this.bitor();
            left = { kind: ExprKind.Logical, left, op: LogicalOp.And, right };
        }
        return left;
    }

    private bitor(): Expr {
        let left = this.bitxor();
        while (this.match(__Kind.Pipe)) {
            const right = this.bitxor();
            left = { kind: ExprKind.Binary, left, op: BinaryOp.BitOr, right };
        }
        return left;
    }

    private bitxor(): Expr {
        let left = this.bitand();
        while (this.match(__Kind.Caret)) {
            const right = this.bitand();
            left = { kind: ExprKind.Binary, left, op: BinaryOp.BitXor, right };
        }
        return left;
    }

    private bitand(): Expr {
        let left = this.eq();
        while (this.match(__Kind.And)) {
            const right = this.eq();
            left = { kind: ExprKind.Binary, left, op: BinaryOp.BitAnd, right };
        }
        return left;
    }

    private eq(): Expr {
        let left = this.comp();
        while (
            this.match(__Kind.EqualEqual) ||
            this.match(__Kind.BangEqual)
        ) {
            const prev = this.previous()!;
            const right = this.comp();

            if (prev.kind === __Kind.EqualEqual)
                left = { kind: ExprKind.Binary, left, op: BinaryOp.Eq, right };
            else
                left = { kind: ExprKind.Binary, left, op: BinaryOp.Neq, right };
        }
        return left;
    }

    private comp(): Expr {
        let left = this.bitshift();
        while (
            this.match(__Kind.Greater) ||
            this.match(__Kind.GreaterEqual) ||
            this.match(__Kind.Lower) ||
            this.match(__Kind.LowerEqual)
        ) {
            const prev = this.previous()!;
            const right = this.bitshift();

            switch (prev.kind) {
                case __Kind.Greater:
                    left = { kind: ExprKind.Binary, left, op: BinaryOp.Gt, right }; break;
                case __Kind.GreaterEqual:
                    left = { kind: ExprKind.Binary, left, op: BinaryOp.Ge, right }; break;
                case __Kind.Lower:
                    left = { kind: ExprKind.Binary, left, op: BinaryOp.Lt, right }; break;
                case __Kind.LowerEqual:
                    left = { kind: ExprKind.Binary, left, op: BinaryOp.Le, right }; break;
            }
        }
        return left;
    }

    private bitshift(): Expr {
        let left = this.term();
        while (
            this.match(__Kind.GreaterGreater) ||
            this.match(__Kind.LowerLower)
        ) {
            const prev = this.previous()!;
            const right = this.term();

            if (prev.kind === __Kind.GreaterGreater)
                left = { kind: ExprKind.Binary, left, op: BinaryOp.Shr, right };
            else
                left = { kind: ExprKind.Binary, left, op: BinaryOp.Shl, right };
        }
        return left;
    }

    private term(): Expr {
        let left = this.factor();
        while (
            this.match(__Kind.Plus) ||
            this.match(__Kind.Minus)
        ) {
            const prev = this.previous()!;
            const right = this.factor();

            if (prev.kind === __Kind.Plus)
                left = { kind: ExprKind.Binary, left, op: BinaryOp.Add, right };
            else
                left = { kind: ExprKind.Binary, left, op: BinaryOp.Sub, right };
        }
        return left;
    }

    private factor(): Expr {
        let left = this.unary();
        while (
            this.match(__Kind.Star) ||
            this.match(__Kind.Slash) ||
            this.match(__Kind.Percent)
        ) {
            const prev = this.previous()!;
            const right = this.unary();

            if (prev.kind === __Kind.Star)
                left = { kind: ExprKind.Binary, left, op: BinaryOp.Mul, right };
            else if (prev.kind === __Kind.Slash)
                left = { kind: ExprKind.Binary, left, op: BinaryOp.Div, right };
            else /* prev.kind === __Kind.Percent */
                left = { kind: ExprKind.Binary, left, op: BinaryOp.Mod, right };
        }
        return left;
    }

    private unary(): Expr {
        if (
            this.match(__Kind.Bang) ||
            this.match(__Kind.Minus) ||
            this.match(__Kind.Tilde) ||
            this.match(__Kind.Plus)
        ) {
            const prev = this.previous()!;
            const right = this.unary();

            if (prev.kind === __Kind.Bang)
                return { kind: ExprKind.Unary, op: UnaryOp.Not, right };
            if (prev.kind === __Kind.Minus)
                return { kind: ExprKind.Unary, op: UnaryOp.Neg, right };
            if (prev.kind === __Kind.Tilde)
                return { kind: ExprKind.Unary, op: UnaryOp.BitNot, right };
            if (prev.kind === __Kind.Plus)
                return right;
        }
        else if (this.tokens[this.cursor] && this.tokens[this.cursor].lexeme === "defined") {
            this.advance();
            const opened = this.match(__Kind.LeftParen);
            const name = this.consume(__Kind.Identifier, "Expected identifier");
            if (opened) this.consume(__Kind.RightParen, "Expected closing ')'");

            return { kind: ExprKind.Value, value: name.lexeme in this.macros ? 1 : 0 };
        }

        return this.primary();
    }

    private primary(): Expr {
        if (this.match(__Kind.Number)) {
            const token = this.previous()!;
            const value = token.extra as number;
            if (!Number.isInteger(value)) throw new Preprocessor.Error(token, "Numbers within preprocessor constant expressions must be integers");
            return { kind: ExprKind.Value, value };
        }

        if (this.match(__Kind.LeftParen)) {
            const inner = this.expression();
            this.consume(__Kind.RightParen, "Expected closing ')'");
            return inner;
        }

        throw new Preprocessor.Error(this.peek(), "Unexpected token");
    }

    private error(): never {
        const self = this.previous();
        this.skip(__Kind.Whitespace);
        const message = [];
        while (!this.done() && !this.match(__Kind.NewLine)) message.push(this.advance()!.lexeme);
        throw new Preprocessor.Error(self, message.join(""));
    }

    private pragma() {
        let ws: Token | null = null;
        if (this.match(__Kind.Whitespace)) ws = this.previous()!;

        this.output.push(this.syntheticToken(__Kind.Hash, "#"), this.syntheticToken(__Kind.Identifier, "pragma"));
        if (ws) this.output.push(ws);
        while (!this.done()) {
            const token = this.advance()!;
            this.output.push(token);
            if (token.kind === __Kind.NewLine) break;
        }
    }

    private extension() {
        let ws: Token | null = null;
        if (this.match(__Kind.Whitespace)) ws = this.previous()!;

        this.output.push(this.syntheticToken(__Kind.Hash, "#"), this.syntheticToken(__Kind.Identifier, "extension"));
        if (ws) this.output.push(ws);
        while (!this.done()) {
            const token = this.advance()!;
            this.output.push(token);
            if (token.kind === __Kind.NewLine) break;
        }
    }

    private check(kind: number): boolean {
        if (this.done()) return false;
        const current = this.peek();
        return current !== null && current.kind === kind;
    }

    private match(kind: number): boolean {
        if (this.check(kind)) {
            this.advance();
            return true;
        }
        return false;
    }

    private skip(kind: number) {
        while (this.check(kind)) this.advance();
    }
    /**
     * Attemps to consume token of `kind`. 
     * On success, returns `true`, and advances the cursor.
     * On failure, throws error with `message`.
     */
    private consume(kind: number, message: string): Token {
        if (this.check(kind)) return this.advance()!;
        throw new Preprocessor.Error(this.peek(), message);
    }

    private advance(): Token | null {
        if (!this.done()) this.cursor += 1;
        return this.previous();
    }

    private previous(): Token | null {
        return this.tokens[this.cursor - 1] ?? null;
    }

    private peek(): Token | null {
        return this.tokens[this.cursor] ?? null;
    }

    private done(): boolean {
        return this.cursor >= this.tokens.length;
    }

    private ignore(): boolean {
        const cond = this.condStack[this.condStack.length - 1];
        if (!cond) return false;
        return !cond.value;
    }

    private syntheticToken(kind: number, lexeme: string, start: number = this.previous()?.start ?? 0, end: number = this.previous()?.end ?? 0): Token {
        return new Token(this.source, kind, start, end, lexeme);
    }
}

const enum ExprKind {
    Value,
    Binary,
    Unary,
    Logical,
}

interface ValueExpr {
    kind: ExprKind.Value,
    value: number,
}

const enum BinaryOp {
    Mul,
    Div,
    Mod,
    Add,
    Sub,
    Shl,
    Shr,
    Lt,
    Le,
    Gt,
    Ge,
    Eq,
    Neq,
    BitAnd,
    BitOr,
    BitXor,
}

interface BinaryExpr {
    kind: ExprKind.Binary,
    left: Expr,
    op: BinaryOp,
    right: Expr,
}

const enum UnaryOp {
    Neg,
    BitNot,
    Not,
}

interface UnaryExpr {
    kind: ExprKind.Unary,
    op: UnaryOp,
    right: Expr,
}

const enum LogicalOp {
    And,
    Or,
}

interface LogicalExpr {
    kind: ExprKind.Logical,
    left: Expr,
    op: LogicalOp,
    right: Expr,
}

type Expr =
    | ValueExpr
    | BinaryExpr
    | UnaryExpr
    | LogicalExpr
    ;


const op = {
    binary: {
        [BinaryOp.Mul]: (l: number, r: number) => l + r,
        [BinaryOp.Div]: (l: number, r: number) => l / r,
        [BinaryOp.Mod]: (l: number, r: number) => l % r,
        [BinaryOp.Add]: (l: number, r: number) => l + r,
        [BinaryOp.Sub]: (l: number, r: number) => l - r,
        [BinaryOp.Shl]: (l: number, r: number) => l << r,
        [BinaryOp.Shr]: (l: number, r: number) => l >> r,
        [BinaryOp.Lt]: (l: number, r: number) => l < r ? 1 : 0,
        [BinaryOp.Le]: (l: number, r: number) => l <= r ? 1 : 0,
        [BinaryOp.Gt]: (l: number, r: number) => l > r ? 1 : 0,
        [BinaryOp.Ge]: (l: number, r: number) => l >= r ? 1 : 0,
        [BinaryOp.Eq]: (l: number, r: number) => l === r ? 1 : 0,
        [BinaryOp.Neq]: (l: number, r: number) => l !== r ? 1 : 0,
        [BinaryOp.BitAnd]: (l: number, r: number) => l & r,
        [BinaryOp.BitOr]: (l: number, r: number) => l | r,
        [BinaryOp.BitXor]: (l: number, r: number) => l ^ r,
    },
    unary: {
        [UnaryOp.Neg]: (r: number) => -r,
        [UnaryOp.BitNot]: (r: number) => ~r,
        [UnaryOp.Not]: (r: number) => r === 0 ? 1 : 0,
    },
}

export namespace Preprocessor {
    export class Error extends globalThis.Error {
        readonly token: Token | null;
        readonly end: Token | null;
        constructor(
            token: Token | null,
            message: string,
            end?: Token | null
        ) {
            super(message);
            this.token = token;
            this.end = end !== undefined ? end : token;
        }
    }

    export interface Output {
        tokens: Token[],
        errors: Error[],
    }
}