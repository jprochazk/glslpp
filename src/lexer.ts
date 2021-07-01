
import { Token, __Kind, __Char } from "./token";

export class Lexer {
    readonly source: string;
    private pos = 0;

    constructor(source: string) {
        this.source = source;
    }

    reset(source: string) {
        (this.source as string) = source;
        this.pos = 0;
    }

    // TODO: @Speed measure the frequency of tokens and increase their priority
    next(): Token | null {
        /* next: */ while (true) {
            if (this.done) return null;

            const previous = this.advance();
            let current = this.current;

            // newlines
            if (previous === __Char.NewLine) {
                return new Token(this.source, __Kind.NewLine as number, this.pos - 1, this.pos, "\n");
            }
            // whitespace
            if (
                (previous === __Char.TabHorizontal) ||
                (previous === __Char.TabVertical) ||
                (previous === __Char.FormFeed) ||
                (previous === __Char.CarriageReturn) ||
                (previous === __Char.Space)
            ) {
                return this.whitespace();
            }

            // identifier
            if (
                // identifier may not start with a digit
                // [a-zA-Z_]
                (previous >= __Char.a && previous <= __Char.z) ||
                (previous >= __Char.A && previous <= __Char.Z) ||
                (previous === __Char.Underscore)
            ) {
                return this.identifier();
            }

            // number starting with digit
            if (previous >= __Char.n0 && previous <= __Char.n9) {
                return this.number(false);
            }

            // 1-3 character tokens
            const start = this.pos - 1;
            switch (previous) {
                case __Char.Semicolon: return new Token(this.source, __Kind.Semicolon as number, start, this.pos, ";");
                case __Char.Equal:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.EqualEqual as number, start, this.pos, "==");
                    } else return new Token(this.source, __Kind.Equal as number, start, this.pos, "=");
                case __Char.Comma: return new Token(this.source, __Kind.Comma as number, start, this.pos, ",");
                case __Char.Plus:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.PlusEqual as number, start, this.pos, "+=");
                    } else if (current === __Char.Plus) {
                        this.advance();
                        return new Token(this.source, __Kind.PlusPlus as number, start, this.pos, "++");
                    } else return new Token(this.source, __Kind.Plus as number, start, this.pos, "+");
                case __Char.Minus:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.MinusEqual as number, start, this.pos, "-=");
                    } else if (current === __Char.Minus) {
                        this.advance();
                        return new Token(this.source, __Kind.MinusMinus as number, start, this.pos, "--");
                    } else return new Token(this.source, __Kind.Minus as number, start, this.pos, "-");
                case __Char.Star:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.StarEqual as number, start, this.pos, "*=");
                    } else return new Token(this.source, __Kind.Star as number, start, this.pos, "*");
                case __Char.Slash:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.SlashEqual as number, start, this.pos, "/=");
                    } else if (current === __Char.Slash) {
                        // single-line comment
                        do {
                            this.advance();
                            current = this.current;
                        }
                        while (!this.done && current !== __Char.NewLine);
                        // skip the final '\n'
                        this.advance();
                        return new Token(this.source, __Kind.LineComment as number, start, this.pos);
                    } else if (current === __Char.Star) {
                        // multi-line comment
                        do {
                            this.advance();
                            current = this.current;
                        } while (!this.done && !(current === __Char.Star && this.peek() === __Char.Slash));
                        // ignore the closing '*/' - 2 characters, so advance twice
                        this.advance(); this.advance();
                        return new Token(this.source, __Kind.BlockComment as number, start, this.pos);
                    } else return new Token(this.source, __Kind.Slash as number, start, this.pos, "/");
                case __Char.LeftParen: return new Token(this.source, __Kind.LeftParen as number, start, this.pos, "(");
                case __Char.RightParen: return new Token(this.source, __Kind.RightParen as number, start, this.pos, ")");
                case __Char.Dot:
                    // float literals may start with a dot,
                    // but they *must* be followed by a number in that case
                    if (previous === __Char.Dot && (current >= __Char.n0 && current <= __Char.n9)) {
                        return this.number(true);
                    } else return new Token(this.source, __Kind.Dot as number, start, this.pos, ".");
                case __Char.LeftBracket: return new Token(this.source, __Kind.LeftBracket as number, start, this.pos, "[");
                case __Char.RightBracket: return new Token(this.source, __Kind.RightBracket as number, start, this.pos, "]");
                case __Char.BackSlash: return new Token(this.source, __Kind.BackSlash as number, start, this.pos, "\\");
                case __Char.Hash: return new Token(this.source, __Kind.Hash as number, start, this.pos, "#");
                case __Char.LeftBrace: return new Token(this.source, __Kind.LeftBrace as number, start, this.pos, "{");
                case __Char.RightBrace: return new Token(this.source, __Kind.RightBrace as number, start, this.pos, "}");
                case __Char.Tilde: return new Token(this.source, __Kind.Tilde as number, start, this.pos, "~");
                case __Char.Bang:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.BangEqual as number, start, this.pos, "!=");
                    } else return new Token(this.source, __Kind.Bang as number, start, this.pos, "!");
                case __Char.Percent:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.PercentEqual as number, start, this.pos, "%=");
                    } else return new Token(this.source, __Kind.Percent as number, start, this.pos, "%");
                case __Char.Lower:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.LowerEqual as number, start, this.pos, "<=");
                    } else if (current === __Char.Lower) {
                        this.advance();
                        current = this.current;
                        if (current === __Char.Equal) {
                            this.advance();
                            return new Token(this.source, __Kind.LowerLowerEqual as number, start, this.pos, "<<=");
                        } else return new Token(this.source, __Kind.LowerLower as number, start, this.pos, "<<");
                    } else return new Token(this.source, __Kind.Lower as number, start, this.pos, "<");
                case __Char.Greater:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.GreaterEqual as number, start, this.pos, ">=");
                    } else if (current === __Char.Greater) {
                        this.advance();
                        current = this.current;
                        if (current === __Char.Equal) {
                            this.advance();
                            return new Token(this.source, __Kind.GreaterGreaterEqual as number, start, this.pos, ">>=");
                        } else return new Token(this.source, __Kind.GreaterGreater as number, start, this.pos, ">>");
                    } else return new Token(this.source, __Kind.Greater as number, start, this.pos, ">");
                case __Char.And:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.AndEqual as number, start, this.pos, "&=");
                    } else if (current === __Char.And) {
                        this.advance();
                        return new Token(this.source, __Kind.AndAnd as number, start, this.pos, "&&");
                    } else return new Token(this.source, __Kind.And as number, start, this.pos, "&");
                case __Char.Caret:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.CaretEqual as number, start, this.pos, "^=");
                    } else if (current === __Char.Caret) {
                        this.advance();
                        return new Token(this.source, __Kind.CaretCaret as number, start, this.pos, "^^");
                    } else return new Token(this.source, __Kind.Caret as number, start, this.pos, "^");
                case __Char.Pipe:
                    if (current === __Char.Equal) {
                        this.advance();
                        return new Token(this.source, __Kind.PipeEqual as number, start, this.pos, "|=");
                    } else if (current === __Char.Pipe) {
                        this.advance();
                        return new Token(this.source, __Kind.PipePipe as number, start, this.pos, "||");
                    } else return new Token(this.source, __Kind.Pipe as number, start, this.pos, "|");
                case __Char.Question: return new Token(this.source, __Kind.Question as number, start, this.pos, "?");
                case __Char.Colon: return new Token(this.source, __Kind.Colon as number, start, this.pos, ":");
            }

            return new Token(this.source, __Kind.Error as number, start, this.pos, undefined, `Unrecognized token: "${this.source.substring(start, this.pos)}"`);
        }
    }

    private whitespace(): Token {
        // -1 because we've already advanced past the first character of the identifier
        // see beginning of `Lexer.next`
        const start = this.pos - 1;

        let current = this.current;
        while (
            (current === __Char.TabHorizontal) ||
            (current === __Char.TabVertical) ||
            (current === __Char.FormFeed) ||
            (current === __Char.CarriageReturn) ||
            (current === __Char.Space)
        ) {
            this.advance();
            current = this.current;
        }

        return new Token(this.source, __Kind.Whitespace as number, start, this.pos);
    }

    private identifier(): Token {
        // -1 because we've already advanced past the first character of the identifier
        // see beginning of `Lexer.next`
        const start = this.pos - 1;

        let current = this.current;
        while (
            (current >= __Char.a && current <= __Char.z) ||
            (current >= __Char.A && current <= __Char.Z) ||
            (current >= __Char.n0 && current <= __Char.n9) ||
            (current === __Char.Underscore)
        ) {
            this.advance();
            current = this.current;
        }

        return new Token(this.source, __Kind.Identifier as number, start, this.pos);
    }

    private number(pastDecimalPoint: boolean): Token {
        // -1 because we've already advanced past the first character of the literal,
        // see beginning of `Lexer.next`
        const start = this.pos - 1;
        let suffix = false;
        let type = "float";

        let current = this.current;

        // 0x hexadecimal-constant
        if (current === __Char.x || current === __Char.X) {
            this.advance();
            current = this.current;
            while (
                (current >= __Char.a && current <= __Char.f) ||
                (current >= __Char.A && current <= __Char.F) ||
                (current >= __Char.n0 && current <= __Char.n9)
            ) {
                this.advance();
                current = this.current;
            }
        }

        // digit-sequence
        while (current >= __Char.n0 && current <= __Char.n9) {
            this.advance()
            current = this.current;
        }

        if (!pastDecimalPoint) {
            // decimal point
            if (current === __Char.Dot) {
                this.advance()
                current = this.current;

                // digit-sequence?
                while (current >= __Char.n0 && current <= __Char.n9) {
                    this.advance()
                    current = this.current;
                }
                // exponent?
                if (current === __Char.e || current === __Char.E) {
                    // exponent
                    this.advance();
                    current = this.current;
                    // sign?
                    if (current === __Char.Plus || current === __Char.Minus) {
                        this.advance();
                        current = this.current;
                    }
                    // digit-sequence
                    while (current >= __Char.n0 && current <= __Char.n9) {
                        this.advance();
                        current = this.current;
                    }
                }
                if (current === __Char.f || current === __Char.F) {
                    // suffix
                    this.advance();
                    current = this.current;
                    suffix = true;
                }
            }
            // unsigned integer suffix?
            else if (current === __Char.u || current === __Char.U) {
                this.advance();
                current = this.current;
                suffix = true;
                type = "integer";
            }
            else {
                type = "integer";
            }
        } else {
            // exponent?
            if (current === __Char.e || current === __Char.E) {
                // exponent
                this.advance();
                current = this.current;
                // sign?
                if (current === __Char.Plus || current === __Char.Minus) {
                    this.advance();
                    current = this.current;
                }
                // digit-sequence
                while (current >= __Char.n0 && current <= __Char.n9) {
                    this.advance();
                    current = this.current;
                }
            }
            // suffix?
            if (current === __Char.f || current === __Char.F) {
                this.advance();
                current = this.current;
                suffix = true;
            }
        }

        // +1 because `this.pos` is *on* the last character, but we want it to be one position after it
        let lexeme = this.source.substring(start, this.pos);

        // JS numeric literals have *almost* exactly the same format as GLSL
        // differences:
        //     octal-constant:
        //          GLSL: 0[0-9]+
        //            JS: 0o[0-9]+
        //     integer-constant:
        //          GLSL: 0 | [1-9][0-9]*[uU]?
        //            JS: [0-9]+
        //     GLSL floats may also end with '[fF]?'

        // if we find an octal-constant, change its prefix to '0o'
        if (type === "integer" && lexeme.length > 1 && lexeme.startsWith("0") && lexeme.charCodeAt(1) > __Char.n0 && lexeme.charCodeAt(1) < __Char.n9) lexeme = "0o" + lexeme.substring(1);
        // confirm that the value is valid (while ignoring any possible suffix)
        const value = Number(lexeme.substring(0, suffix ? lexeme.length - 1 : lexeme.length));
        if (Number.isNaN(value)) {
            return new Token(this.source, __Kind.Error as number, start, this.pos, undefined, `Invalid ${type} literal`);
        }

        return new Token(this.source, __Kind.Number as number, start, this.pos, undefined, value);
    }

    // TODO: @Speed manually inline all of these, because V8 won't
    // leave behind comments like /* advance */ so that the inlining may be reversed
    /** Advances the cursor and returns the *previous* token */
    private advance(): number {
        return this.source.charCodeAt(this.pos++);
    }
    /** Returns the token after `this.current` without advancing the cursor */
    private peek(): number {
        return this.source.charCodeAt(this.pos + 1);
    }
    /** Returns the token currently under the cursor */
    private get current(): number {
        return this.source.charCodeAt(this.pos);
    }
    /** Returns `true` if the entire source has been processed */
    private get done(): boolean {
        return this.pos >= this.source.length;
    }

    all(): Token[] {
        const out = [];
        let token = this.next();
        while (token) {
            out.push(token);
            token = this.next();
        }
        return out;
    }

    // Enables the lexer to be used in a for-of loop.
    [Symbol.iterator] = (() => {
        // eslint-disable-line
        const self = this;
        return function* () {
            while (true) {
                const next = self.next();
                if (next === null) break;
                yield next;
            }
        }
    })();
}
