
export class Lexer {
    public readonly source: string;
    private pos = 0;

    constructor(
        source: string,
    ) {
        this.source = source;
    }

    next(): Token | null {
        next: while (true) {
            const previous = this.advance();
            let current = this.current;

            // whitespace
            if (
                (previous >= Char.TabHorizontal && previous <= Char.CarriageReturn) ||
                (previous === Char.Space)
            ) {
                continue next;
            }

            // identifier
            if (
                // identifier may not start with a digit
                // [a-zA-Z_]
                (previous >= Char.a && previous <= Char.z) ||
                (previous >= Char.A && previous <= Char.Z) ||
                (previous === Char.Underscore)
            ) {
                return this.identifier();
            }

            // number starting with digit
            if (previous >= Char.n0 && previous <= Char.n9) {
                return this.number(false);
            }

            // 1-3 character tokens
            switch (previous) {
                case Char.Semicolon: return new Token(this.source, _TK.Semicolon as number, this.pos, this.pos + 1);
                case Char.Equal:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.EqualEqual as number, this.pos - 1, this.pos + 1);
                    } else return new Token(this.source, _TK.Equal as number, this.pos, this.pos + 1);
                case Char.Comma: return new Token(this.source, _TK.Comma as number, this.pos, this.pos + 1);
                case Char.Plus:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.PlusEqual as number, this.pos - 1, this.pos + 1);
                    } else if (current === Char.Plus) {
                        this.advance();
                        return new Token(this.source, _TK.PlusPlus as number, this.pos - 1, this.pos + 1);
                    } else return new Token(this.source, _TK.Plus as number, this.pos, this.pos + 1);
                case Char.Minus:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.MinusEqual as number, this.pos - 1, this.pos + 1);
                    } else if (current === Char.Minus) {
                        this.advance();
                        return new Token(this.source, _TK.MinusMinus as number, this.pos - 1, this.pos + 1);
                    } else return new Token(this.source, _TK.Minus as number, this.pos, this.pos + 1);
                case Char.Star:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.StarEqual as number, this.pos - 1, this.pos + 1);
                    } else return new Token(this.source, _TK.Star as number, this.pos, this.pos + 1);
                case Char.Slash:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.SlashEqual as number, this.pos - 1, this.pos + 1);
                    } else if (current === Char.Slash) {
                        // single-line comment
                        this.advance();
                        current = this.current;
                        while (!this.done && current !== Char.NewLine) {
                            this.advance();
                            current = this.current;
                        }
                        // skip the final '\n'
                        this.advance();
                        continue next;
                    } else if (current === Char.Star) {
                        // multi-line comment
                        this.advance();
                        current = this.current;
                        while (!this.done && !(current === Char.Star && this.peek() === Char.Slash)) {
                            this.advance();
                            current = this.current;
                        }
                        // ignore the closing '*/' - 2 characters, so advance twice
                        this.advance();
                        this.advance();
                        continue next;
                    } else return new Token(this.source, _TK.Slash as number, this.pos, this.pos + 1);
                case Char.LeftParen: return new Token(this.source, _TK.LeftParen as number, this.pos, this.pos + 1);
                case Char.RightParen: return new Token(this.source, _TK.RightParen as number, this.pos, this.pos + 1);
                case Char.LeftBracket: return new Token(this.source, _TK.LeftBracket as number, this.pos, this.pos + 1);
                case Char.RightBracket: return new Token(this.source, _TK.RightBracket as number, this.pos, this.pos + 1);
                case Char.BackSlash: return new Token(this.source, _TK.BackSlash as number, this.pos, this.pos + 1);
                case Char.Hash: return new Token(this.source, _TK.Hash as number, this.pos, this.pos + 1);
                case Char.LeftBrace: return new Token(this.source, _TK.LeftBrace as number, this.pos, this.pos + 1);
                case Char.RightBrace: return new Token(this.source, _TK.RightBrace as number, this.pos, this.pos + 1);
                case Char.Tilde: return new Token(this.source, _TK.Tilde as number, this.pos, this.pos + 1);
                case Char.Bang:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.BangEqual as number, this.pos - 1, this.pos + 1);
                    } else return new Token(this.source, _TK.Bang as number, this.pos, this.pos + 1);
                case Char.Percent:
                    if (current === Char.Equal) return new Token(this.source, _TK.PercentEqual as number, this.pos - 1, this.pos + 1);
                    else return new Token(this.source, _TK.Percent as number, this.pos - 1, this.pos);
                case Char.Lower:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.LowerEqual as number, this.pos - 1, this.pos + 1);
                    } else if (current === Char.Lower) {
                        this.advance();
                        current = this.current;
                        if (current === Char.Equal) {
                            this.advance();
                            return new Token(this.source, _TK.LowerLowerEqual as number, this.pos - 1, this.pos + 1);
                        } else return new Token(this.source, _TK.LowerLower as number, this.pos, this.pos + 1);
                    } else return new Token(this.source, _TK.Lower as number, this.pos, this.pos + 1);
                case Char.Greater:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.GreaterEqual as number, this.pos - 1, this.pos + 1);
                    } else if (current === Char.Greater) {
                        this.advance();
                        current = this.current;
                        if (current === Char.Equal) {
                            this.advance();
                            return new Token(this.source, _TK.GreaterGreaterEqual as number, this.pos - 1, this.pos + 1);
                        } else return new Token(this.source, _TK.GreaterGreater as number, this.pos, this.pos + 1);
                    } else return new Token(this.source, _TK.Greater as number, this.pos, this.pos + 1);
                case Char.And:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.AndEqual as number, this.pos - 1, this.pos + 1);
                    } else if (current === Char.And) {
                        this.advance();
                        return new Token(this.source, _TK.AndAnd as number, this.pos - 1, this.pos + 1);
                    } else return new Token(this.source, _TK.And as number, this.pos, this.pos + 1);
                case Char.Caret:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.CaretEqual as number, this.pos - 1, this.pos + 1);
                    } else if (current === Char.Caret) {
                        this.advance();
                        return new Token(this.source, _TK.CaretCaret as number, this.pos - 1, this.pos + 1);
                    } else return new Token(this.source, _TK.Caret as number, this.pos, this.pos + 1);
                case Char.Pipe:
                    if (current === Char.Equal) {
                        this.advance();
                        return new Token(this.source, _TK.PipeEqual as number, this.pos - 1, this.pos + 1);
                    } else if (current === Char.Pipe) {
                        this.advance();
                        return new Token(this.source, _TK.PipePipe as number, this.pos - 1, this.pos + 1);
                    } else return new Token(this.source, _TK.Pipe as number, this.pos, this.pos + 1);
                case Char.Question: return new Token(this.source, _TK.Question as number, this.pos, this.pos + 1);
                case Char.Colon: return new Token(this.source, _TK.Colon as number, this.pos, this.pos + 1);
            }

            // TODO: de-prioritize this, because it's rare
            if (previous === Char.Dot) {
                // float literals may start with a dot,
                // but they *must* be followed by a number in that case
                if (previous === Char.Dot && (current >= Char.n0 && current <= Char.n9)) {
                    return this.number(true);
                }

                return new Token(this.source, _TK.Dot as number, this.pos, this.pos + 1);
            }

            return null;
        }
    }

    private identifier(): Token {
        // -1 because we've already advanced past the first character of the identifier
        const start = this.pos - 1;

        let current = this.current;
        while (
            (current >= Char.a && current <= Char.z) ||
            (current >= Char.A && current <= Char.Z) ||
            (current >= Char.n0 && current <= Char.n9) ||
            (current === Char.Underscore)
        ) {
            this.advance();
            current = this.current;
        }

        return new Token(this.source, _TK.Identifier as number, start, this.pos);
    }

    private number(pastDecimalPoint: boolean): Token {
        // -1 because we've already advanced past the first character of the literal
        const start = this.pos - 1;
        let suffix = false;
        let type = "float";

        // digit-sequence
        let current = this.current;
        while (current >= Char.n0 && current <= Char.n9) {
            this.advance()
            current = this.current;
        }

        if (!pastDecimalPoint) {
            // decimal point
            if (current === Char.Dot) {
                this.advance()
                current = this.current;

                // digit-sequence?
                while (current >= Char.n0 && current <= Char.n9) {
                    this.advance()
                    current = this.current;
                }
                // exponent?
                if (current === Char.e || current == Char.E) {
                    // exponent
                    this.advance();
                    current = this.current;
                    // sign?
                    if (current === Char.Plus || current === Char.Minus) {
                        this.advance();
                        current = this.current;
                    }
                    // digit-sequence
                    while (current >= Char.n0 && current <= Char.n9) {
                        this.advance();
                        current = this.current;
                    }
                }
                if (current === Char.f || current === Char.F) {
                    // suffix
                    this.advance();
                    current = this.current;
                    suffix = true;
                }
            }
            // unsigned integer suffix?
            else if (current === Char.u || current === Char.U) {
                this.advance();
                current = this.current;
                suffix = true;
                type = "integer";
            } else {
                type = "integer";
            }
        } else {
            // exponent?
            if (current === Char.e || current == Char.E) {
                // exponent
                this.advance();
                current = this.current;
                // sign?
                if (current === Char.Plus || current === Char.Minus) {
                    this.advance();
                    current = this.current;
                }
                // digit-sequence
                while (current >= Char.n0 && current <= Char.n9) {
                    this.advance();
                    current = this.current;
                }
            }
            // suffix?
            if (current === Char.f || current === Char.F) {
                this.advance();
                current = this.current;
                suffix = true;
            }
        }

        // +1 because `this.pos` is *on* the last character, but we want it to be one position after it
        const lexeme = this.source.substring(start, this.pos);
        // JS doesn't support suffixes, so trim it in case we have one. Other than that, 
        // JS numeric literals have exactly the same format as GLSL, so we can take 
        // advantage of it to check if the number is valid.
        const value = Number(lexeme.substring(0, suffix ? lexeme.length - 1 : lexeme.length));
        if (Number.isNaN(value)) {
            return new Token(this.source, _TK.Error as number, start, this.pos, `Invalid ${type} literal`);
        }

        return new Token(this.source, _TK.Number as number, start, this.pos, type);
    }

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

    private get done(): boolean {
        return this.pos >= this.source.length;
    }

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

export class Token {
    constructor(
        private readonly source: string,
        readonly kind: Token.Kind,
        readonly start: number,
        readonly end: number,
        readonly extra: any = undefined,
    ) {
    }

    /** The error message of an error token */
    get error(): string | undefined {
        if (this.kind === _TK.Error as number) return this.extra;
        return undefined;
    }

    private _lexeme: string | null = null;
    get lexeme() {
        this._lexeme ??= this.source.substring(this.start, this.end);
        return this._lexeme;
    }

    toString() {
        switch (this.kind as number) {
            case _TK.Identifier: return `Identifier(${this.lexeme})`;
            case _TK.Number: return `Number(${this.lexeme})`;
            default: return `${Token.Kind[this.kind]}`;
        }
    }
}

// because const enums can't be exported correctly,
// this internally uses a const enum for performance reasons
const enum _TK {
    Error,
    Semicolon,

    Hash,
    BackSlash,

    /** { */ LeftBrace,
    /** } */ RightBrace,

    // Literals
    Identifier,
    Number,

    // Operators
    // Some tokens are also re-used in other contexts,
    // such as parentheses used in function declarations.
    // Ordered according to precedence
    // P1
    /** ( */ LeftParen,
    /** ) */ RightParen,
    // P2
    /** [ */ LeftBracket,
    /** ] */ RightBracket,
    /** . */ Dot,
    /** ++ */ PlusPlus,   // P3 start
    /** -- */ MinusMinus, // P2 end
    // P3
    /** + */ Plus,  // P5
    /** - */ Minus, // P5
    /** ~ */ Tilde,
    /** ! */ Bang,
    // P4
    /** * */ Star,
    /** / */ Slash,
    /** % */ Percent,
    // P6
    /** << */ LowerLower,
    /** >> */ GreaterGreater,
    // P7
    /** < */ Lower,
    /** > */ Greater,
    /** <= */ LowerEqual,
    /** >= */ GreaterEqual,
    // P8
    /** == */ EqualEqual,
    /** != */ BangEqual,
    // P9
    /** & */ And,
    // P10
    /** ^ */ Caret,
    // P11
    /** | */ Pipe,
    // P12
    /** && */ AndAnd,
    // P13
    /** ^^ */ CaretCaret,
    // P14
    /** || */ PipePipe,
    // P15
    /** ? */ Question,
    /** : */ Colon,
    // P16
    /** = */ Equal,
    /** += */ PlusEqual,
    /** -= */ MinusEqual,
    /** *= */ StarEqual,
    /** /= */ SlashEqual,
    /** %= */ PercentEqual,
    /** <<= */ LowerLowerEqual,
    /** >>= */ GreaterGreaterEqual,
    /** &= */ AndEqual,
    /** ^= */ CaretEqual,
    /** |= */ PipeEqual,
    // P17
    /** , */ Comma,
}

export namespace Token {
    export enum Kind {
        Error,
        Semicolon,

        Hash,
        BackSlash,

        /** { */ LeftBrace,
        /** } */ RightBrace,

        // Literals
        Identifier,
        Number,

        // Operators
        // Some tokens are also re-used in other contexts,
        // such as parentheses used in function declarations.
        // Ordered according to precedence
        // P1
        /** ( */ LeftParen,
        /** ) */ RightParen,
        // P2
        /** [ */ LeftBracket,
        /** ] */ RightBracket,
        /** . */ Dot,
        /** ++ */ PlusPlus,   // P3 start
        /** -- */ MinusMinus, // P2 end
        // P3
        /** + */ Plus,  // P5
        /** - */ Minus, // P5
        /** ~ */ Tilde,
        /** ! */ Bang,
        // P4
        /** * */ Star,
        /** / */ Slash,
        /** % */ Percent,
        // P6
        /** << */ LowerLower,
        /** >> */ GreaterGreater,
        // P7
        /** < */ Lower,
        /** > */ Greater,
        /** <= */ LowerEqual,
        /** >= */ GreaterEqual,
        // P8
        /** == */ EqualEqual,
        /** != */ BangEqual,
        // P9
        /** & */ And,
        // P10
        /** ^ */ Caret,
        // P11
        /** | */ Pipe,
        // P12
        /** && */ AndAnd,
        // P13
        /** ^^ */ CaretCaret,
        // P14
        /** || */ PipePipe,
        // P15
        /** ? */ Question,
        /** : */ Colon,
        // P16
        /** = */ Equal,
        /** += */ PlusEqual,
        /** -= */ MinusEqual,
        /** *= */ StarEqual,
        /** /= */ SlashEqual,
        /** %= */ PercentEqual,
        /** <<= */ LowerLowerEqual,
        /** >>= */ GreaterGreaterEqual,
        /** &= */ AndEqual,
        /** ^= */ CaretEqual,
        /** |= */ PipeEqual,
        // P17
        /** , */ Comma,
    }
}


const enum Char {
    TabHorizontal = 9,
    NewLine = 10,
    TabVertical = 11,
    FormFeed = 12,
    CarriageReturn = 13,
    Space = 32,
    BackSlash = 92,
    Hash = 35,
    LeftBrace = 123,
    RightBrace = 125,
    LeftParen = 40,
    RightParen = 41,
    LeftBracket = 91,
    RightBracket = 93,
    Dot = 46,
    Plus = 43,
    Minus = 45,
    Tilde = 126,
    Bang = 33,
    Star = 42,
    Slash = 47,
    Percent = 37,
    Lower = 60,
    Greater = 62,
    And = 38,
    Caret = 94,
    Pipe = 124,
    Question = 63,
    Colon = 58,
    Equal = 61,
    Comma = 44,
    Semicolon = 59,
    A = 65,
    B = 66,
    C = 67,
    D = 68,
    E = 69,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    J = 74,
    K = 75,
    L = 76,
    M = 77,
    N = 78,
    O = 79,
    P = 80,
    Q = 81,
    R = 82,
    S = 83,
    T = 84,
    U = 85,
    V = 86,
    W = 87,
    X = 88,
    Y = 89,
    Z = 90,
    a = 97,
    b = 98,
    c = 99,
    d = 100,
    e = 101,
    f = 102,
    g = 103,
    h = 104,
    i = 105,
    j = 106,
    k = 107,
    l = 108,
    m = 109,
    n = 110,
    o = 111,
    p = 112,
    q = 113,
    r = 114,
    s = 115,
    t = 116,
    u = 117,
    v = 118,
    w = 119,
    x = 120,
    y = 121,
    z = 122,
    Underscore = 95,
    n0 = 48,
    n1 = 49,
    n2 = 50,
    n3 = 51,
    n4 = 52,
    n5 = 53,
    n6 = 54,
    n7 = 55,
    n8 = 56,
    n9 = 57,
}

export const enum Keyword {
    const = "const",
    uniform = "uniform",
    layout = "layout",
    centroid = "centroid",
    flat = "flat",
    smooth = "smooth",
    break = "break",
    continue = "continue",
    do = "do",
    for = "for",
    while = "while",
    switch = "switch",
    case = "case",
    default = "default",
    if = "if",
    else = "else",
    in = "in",
    out = "out",
    inout = "inout",
    float = "float",
    int = "int",
    void = "void",
    bool = "bool",
    true = "true",
    false = "false",
    invariant = "invariant",
    discard = "discard",
    return = "return",
    mat2 = "mat2",
    mat3 = "mat3",
    mat4 = "mat4",
    mat2x2 = "mat2x2",
    mat2x3 = "mat2x3",
    mat2x4 = "mat2x4",
    mat3x2 = "mat3x2",
    mat3x3 = "mat3x3",
    mat3x4 = "mat3x4",
    mat4x2 = "mat4x2",
    mat4x3 = "mat4x3",
    mat4x4 = "mat4x4",
    vec2 = "vec2",
    vec3 = "vec3",
    vec4 = "vec4",
    ivec2 = "ivec2",
    ivec3 = "ivec3",
    ivec4 = "ivec4",
    bvec2 = "bvec2",
    bvec3 = "bvec3",
    bvec4 = "bvec4",
    uint = "uint",
    uvec2 = "uvec2",
    uvec3 = "uvec3",
    uvec4 = "uvec4",
    lowp = "lowp",
    mediump = "mediump",
    highp = "highp",
    precision = "precision",
    sampler2D = "sampler2D",
    sampler3D = "sampler3D",
    samplerCube = "samplerCube",
    sampler2DShadow = "sampler2DShadow",
    samplerCubeShadow = "samplerCubeShadow",
    sampler2DArray = "sampler2DArray",
    sampler2DArrayShadow = "sampler2DArrayShadow",
    isampler2D = "isampler2D",
    isampler3D = "isampler3D",
    isamplerCube = "isamplerCube",
    isampler2DArray = "isampler2DArray",
    usampler2D = "usampler2D",
    usampler3D = "usampler3D",
    usamplerCube = "usamplerCube",
    usampler2DArray = "usampler2DArray",
    struct = "struct",

    // Unused
    attribute = "attribute",
    varying = "varying",
    coherent = "coherent",
    restrict = "restrict",
    readonly = "readonly",
    writeonly = "writeonly",
    resource = "resource",
    atomic_uint = "atomic_uint",
    noperspective = "noperspective",
    patch = "patch",
    sample = "sample",
    subroutine = "subroutine",
    common = "common",
    partition = "partition",
    active = "active",
    asm = "asm",
    class = "class",
    union = "union",
    enum = "enum",
    typedef = "typedef",
    template = "template",
    this = "this",
    goto = "goto",
    inline = "inline",
    noinline = "noinline",
    volatile = "volatile",
    public = "public",
    static = "static",
    extern = "extern",
    external = "external",
    interface = "interface",
    long = "long",
    short = "short",
    double = "double",
    half = "half",
    fixed = "fixed",
    unsigned = "unsigned",
    superp = "superp",
    input = "input",
    output = "output",
    hvec2 = "hvec2",
    hvec3 = "hvec3",
    hvec4 = "hvec4",
    dvec2 = "dvec2",
    dvec3 = "dvec3",
    dvec4 = "dvec4",
    fvec2 = "fvec2",
    fvec3 = "fvec3",
    fvec4 = "fvec4",
    sampler3DRect = "sampler3DRect",
    filter = "filter",
    image1D = "image1D",
    image2D = "image2D",
    image3D = "image3D",
    imageCube = "imageCube",
    iimage1D = "iimage1D",
    iimage2D = "iimage2D",
    iimage3D = "iimage3D",
    iimageCube = "iimageCube",
    uimage1D = "uimage1D",
    uimage2D = "uimage2D",
    uimage3D = "uimage3D",
    uimageCube = "uimageCube",
    image1DArray = "image1DArray",
    image2DArray = "image2DArray",
    iimage1DArray = "iimage1DArray",
    iimage2DArray = "iimage2DArray",
    uimage1DArray = "uimage1DArray",
    uimage2DArray = "uimage2DArray",
    imageBuffer = "imageBuffer",
    iimageBuffer = "iimageBuffer",
    uimageBuffer = "uimageBuffer",
    sampler1D = "sampler1D",
    sampler1DShadow = "sampler1DShadow",
    sampler1DArray = "sampler1DArray",
    sampler1DArrayShadow = "sampler1DArrayShadow",
    isampler1D = "isampler1D",
    isampler1DArray = "isampler1DArray",
    usampler1D = "usampler1D",
    usampler1DArray = "usampler1DArray",
    sampler2DRect = "sampler2DRect",
    sampler2DRectShadow = "sampler2DRectShadow",
    isampler2DRect = "isampler2DRect",
    usampler2DRect = "usampler2DRect",
    samplerBuffer = "samplerBuffer",
    isamplerBuffer = "isamplerBuffer",
    usamplerBuffer = "usamplerBuffer",
    sampler2DMS = "sampler2DMS",
    isampler2DMS = "isampler2DMS",
    usampler2DMS = "usampler2DMS",
    sampler2DMSArray = "sampler2DMSArray",
    isampler2DMSArray = "isampler2DMSArray",
    usampler2DMSArray = "usampler2DMSArray",
    sizeof = "sizeof",
    cast = "cast",
    namespace = "namespace",
    using = "using",
}

/*
        nextToken: while (true) {
            if (this.current >= this.source.length) return null;

            let kind: number = _TK.Error;
            const start: number = this.current;
            let end: number = this.current + 1;
            let error: string | undefined;

            let char = this.source.charCodeAt(this.current);

            while (true) {
                if ((char >= Char.TabHorizontal && char <= Char.CarriageReturn) || char === Char.Space) {
                    char = this.source.charCodeAt(++this.current);
                    continue;
                } else {
                    break;
                }
            }

            // numbers starting with a digit
            // digit-sequence
            if (char >= Char.n0 && char <= Char.n9) {
                do {
                    char = this.source.charCodeAt(++this.current);
                } while (char >= Char.n0 && char <= Char.n9);
                // digit-sequence .
                char = this.source.charCodeAt(++this.current);
                switch (char) {
                    case Char.Dot:
                }
            }

            if ((char >= Char.A && char <= Char.z) || char === Char.Underscore) {
                // skip [a-zA-Z0-9_]
                while (IdentRegExp.test(this.source.charAt(++this.current))) { }
                end = this.current;

                return new Token(this.source, _TK.Identifier as number, start, end);
            }

            switch (char) {
                case Char.LeftBrace: kind = _TK.LeftBrace; break;
                case Char.RightBrace: kind = _TK.RightBrace; break;
                case Char.LeftParen: kind = _TK.LeftParen; break;
                case Char.RightParen: kind = _TK.RightParen; break;
                case Char.LeftBracket: kind = _TK.LeftBracket; break;
                case Char.RightBracket: kind = _TK.RightBracket; break;
                case Char.Plus: {
                    kind = _TK.Plus;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Plus) {
                        kind = _TK.PlusPlus;
                        end = (this.current++) + 1;
                    }
                    else if (next === Char.Equal) {
                        kind = _TK.PlusEqual;
                        end = (this.current++) + 1;
                    }
                } break;
                case Char.Minus: {
                    kind = _TK.Minus;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Minus) {
                        kind = _TK.MinusMinus;
                        end = (this.current++) + 1;
                    }
                    else if (next === Char.Equal) {
                        kind = _TK.MinusEqual;
                        end = (this.current++) + 1;
                    }
                } break;
                case Char.Tilde: kind = _TK.Tilde; break;
                case Char.Bang: {
                    kind = _TK.Bang;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.BangEqual;
                        end = (this.current++) + 1;
                    }
                } break;
                case Char.Star: {
                    kind = _TK.Star;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.StarEqual;
                        end = (this.current++) + 1;
                    }
                } break;
                case Char.Slash: {
                    kind = _TK.Slash;
                    let next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.SlashEqual;
                        end = (this.current++) + 1;
                    }
                    else if (next === Char.Slash) {
                        // single-line comment
                        next = this.source.charCodeAt(++this.current);
                        while (!(this.current >= this.source.length) && next !== Char.NewLine) {
                            next = this.source.charCodeAt(++this.current)
                        }
                        this.current += 1;
                        continue nextToken;
                    }
                    else if (next === Char.Star) {
                        // multi-line comment
                        next = this.source.charCodeAt(++this.current);
                        while (!(this.current >= this.source.length) && !(next === Char.Star && this.source.charCodeAt(this.current + 1) === Char.Slash)) {
                            next = this.source.charCodeAt(++this.current);
                        }
                        this.current += 2;
                        continue nextToken;
                    }
                } break;
                case Char.Percent: {
                    kind = _TK.Percent;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.PercentEqual;
                        end = (this.current++) + 1;
                    }
                } break;
                case Char.Lower: {
                    kind = _TK.Lower;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.LowerEqual;
                        end = (this.current++) + 1;
                    }
                    else if (next === Char.Lower) {
                        kind = _TK.LowerLower;
                        end = (this.current++) + 1;
                        const next = this.source.charCodeAt(this.current + 1);
                        if (next === Char.Equal) {
                            kind = _TK.LowerLowerEqual;
                            end = (this.current++) + 1;
                        }
                    }
                } break;
                case Char.Greater: {
                    kind = _TK.Greater;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.GreaterEqual;
                        end = (this.current++) + 1;
                    }
                    else if (next === Char.Greater) {
                        kind = _TK.GreaterGreater;
                        end = (this.current++) + 1;
                        const next = this.source.charCodeAt(this.current + 1);
                        if (next === Char.Equal) {
                            kind = _TK.GreaterGreaterEqual;
                            end = (this.current++) + 1;
                        }
                    }
                } break;
                case Char.And: {
                    kind = _TK.And;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.AndEqual;
                        end = (this.current++) + 1;
                    }
                    else if (next === Char.And) {
                        kind = _TK.AndAnd;
                        end = (this.current++) + 1;
                    }
                } break;
                case Char.Caret: {
                    kind = _TK.Caret;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.CaretEqual;
                        end = (this.current++) + 1;
                    }
                    else if (next === Char.Caret) {
                        kind = _TK.CaretCaret;
                        end = (this.current++) + 1;
                    }
                } break;
                case Char.Pipe: {
                    kind = _TK.Pipe;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.PipeEqual;
                        end = (this.current++) + 1;
                    }
                    else if (next === Char.Pipe) {
                        kind = _TK.PipePipe;
                        end = (this.current++) + 1;
                    }
                } break;
                case Char.Question: kind = _TK.Question; break;
                case Char.Colon: kind = _TK.Colon; break;
                case Char.Equal: {
                    kind = _TK.Equal;
                    const next = this.source.charCodeAt(this.current + 1);
                    if (next === Char.Equal) {
                        kind = _TK.EqualEqual;
                        end = (this.current++) + 1;
                    }
                } break;
                case Char.Comma: kind = _TK.Comma; break;
                case Char.Semicolon: kind = _TK.Semicolon; break;
                case Char.Hash: kind = _TK.Hash; break;
                case Char.BackSlash: kind = _TK.BackSlash; break
                default: {
                    kind = _TK.Error;
                    error = "Invalid token";
                } break;
            }

            this.current += 1;
            return new Token(this.source, kind, start, end, error);
        }
*/