
export class Token {
    readonly lexeme: string;
    constructor(
        readonly source: string,
        readonly kind: number,
        readonly start: number,
        readonly end: number,
        lexeme?: string,
        readonly extra?: any
    ) {
        this.lexeme = lexeme ?? this.source.substring(this.start, this.end);
    }

    toString() {
        switch (this.kind as number) {
            case __Kind.Error: /* fallthrough */
            case __Kind.Whitespace: /* fallthrough */
            case __Kind.LineComment: /* fallthrough */
            case __Kind.BlockComment: /* fallthrough */
            case __Kind.Identifier: /* fallthrough */
            case __Kind.Number: /* fallthrough */
                return `${Token.Kind[this.kind]}(${this.lexeme})`;
            default: return `${Token.Kind[this.kind]}`;
        }
    }
}

export namespace Token {
    // NOTE: any changes to this enum must be reflected in `_Kind`
    /**
     * All possible token kinds
     * 
     * Operators are ordered according to precedence,
     * so that checking for precendence can be done
     * with a range check. For example precendence 7 (comparison):
     * ```ts
     * if (token.kind >= Token.Kind.Lower && token.kind <= Token.Kind.GreaterEqual) {
     *   // ...
     * }
     * ```
     * This is far more efficient than checking for 4 different kinds, especially so
     * in the case of assignment operators, of which there are 11.
     */
    export enum Kind {
        /**
         * Represents an invalid or incomplete token.
         * When a Token is of this kind, then it also
         * has an `error` property, which contains the
         * specific error message.
         **/
        Error,

        /**
         * One of:
         * * `\t`
         * * `\n`
         * * `\v`
         * * `\r`
         * * `\f`
         * * ` `
         **/
        Whitespace,
        /** '\n' */
        NewLine,
        /** Comments preceded by '//' */
        LineComment,
        /** Comments encased in '/*', '\*\/' */
        BlockComment,

        // Misc tokens
        /** `;` */ Semicolon,
        /** `#` */ Hash,
        /** `\` */ BackSlash,
        /** `{` */ LeftBrace,
        /** `}` */ RightBrace,

        // Literals
        Identifier,
        Number,

        // Operators
        /** P1 `(` */ LeftParen,
        /** P1 `)` */ RightParen,
        // P2
        /** P2 `[` */ LeftBracket,
        /** P2 `]` */ RightBracket,
        /** P2 `.` */ Dot,
        /** P2, P3 (start) `++` */ PlusPlus,   // P3 start
        /** P2, P2 (end) `--` */ MinusMinus, // P2 end
        // P3
        /** P3, P5 `+` */ Plus,  // P5
        /** P3, P5 `-` */ Minus, // P5
        /** P3 `~` */ Tilde,
        /** P3 `!` */ Bang,
        // P4
        /** P4 `*` */ Star,
        /** P4 `/` */ Slash,
        /** P4 `%` */ Percent,
        // P6
        /** P6 `<<` */ LowerLower,
        /** P6 `>>` */ GreaterGreater,
        // P7
        /** P7 `<` */ Lower,
        /** P7 `>` */ Greater,
        /** P7 `<=` */ LowerEqual,
        /** P7 `>=` */ GreaterEqual,
        // P8
        /** P8 `==` */ EqualEqual,
        /** P8 `!=` */ BangEqual,
        // P9
        /** P9 `&` */ And,
        // P10
        /** P10 `^` */ Caret,
        // P11
        /** P11 `|` */ Pipe,
        // P12
        /** P12 `&&` */ AndAnd,
        // P13
        /** P13 `^^` */ CaretCaret,
        // P14
        /** P14 `||` */ PipePipe,
        // P15
        /** P15 `?` */ Question,
        /** P15 `:` */ Colon,
        // P16
        /** P16 `=` */ Equal,
        /** P16 `+=` */ PlusEqual,
        /** P16 `-=` */ MinusEqual,
        /** P16 `*=` */ StarEqual,
        /** P16 `/=` */ SlashEqual,
        /** P16 `%=` */ PercentEqual,
        /** P16 `<<=` */ LowerLowerEqual,
        /** P16 `>>=` */ GreaterGreaterEqual,
        /** P16 `&=` */ AndEqual,
        /** P16 `^=` */ CaretEqual,
        /** P16 `|=` */ PipeEqual,
        // P17
        /** P17 `,` */ Comma,
    }
}


// because const enums are erased at compile-time, they can't
// be exported, but a regular enum has massive overhead, so
// the lexer internally uses a const enum
/** For internal use only. */
export const enum __Kind {
    Error,
    Whitespace,
    NewLine,
    LineComment,
    BlockComment,
    Semicolon,
    Hash,
    BackSlash,
    LeftBrace,
    RightBrace,
    Identifier,
    Number,
    LeftParen,
    RightParen,
    LeftBracket,
    RightBracket,
    Dot,
    PlusPlus,
    MinusMinus,
    Plus,
    Minus,
    Tilde,
    Bang,
    Star,
    Slash,
    Percent,
    LowerLower,
    GreaterGreater,
    Lower,
    Greater,
    LowerEqual,
    GreaterEqual,
    EqualEqual,
    BangEqual,
    And,
    Caret,
    Pipe,
    AndAnd,
    CaretCaret,
    PipePipe,
    Question,
    Colon,
    Equal,
    PlusEqual,
    MinusEqual,
    StarEqual,
    SlashEqual,
    PercentEqual,
    LowerLowerEqual,
    GreaterGreaterEqual,
    AndEqual,
    CaretEqual,
    PipeEqual,
    Comma,
}

/**
 * GLSL character set, for internal use only.
 * 
 * This enum is a mapping of `char -> char code`,
 * which exists because:
 * 1. It's much faster to compare char codes rather than one-character strings
 * 2. While it's faster to use char codes, it's error prone, so having an
 * enum of them like this prevents bugs
 * 3. It enables character range checks (e.g. range `a` to `z`)
 */
export const enum __Char {
    /** `\t` */
    TabHorizontal = 9,
    /** `\n` */
    NewLine = 10,
    /** `\v` */
    TabVertical = 11,
    /** `\f` */
    FormFeed = 12,
    /** `\r` */
    CarriageReturn = 13,
    /** ` ` */
    Space = 32,
    /** `\\` */
    BackSlash = 92,
    /** `#` */
    Hash = 35,
    /** `[` */
    LeftBrace = 123,
    /** `]` */
    RightBrace = 125,
    /** `(` */
    LeftParen = 40,
    /** `)` */
    RightParen = 41,
    /** `{` */
    LeftBracket = 91,
    /** `}` */
    RightBracket = 93,
    /** `.` */
    Dot = 46,
    /** `+` */
    Plus = 43,
    /** `-` */
    Minus = 45,
    /** `~` */
    Tilde = 126,
    /** `!` */
    Bang = 33,
    /** `*` */
    Star = 42,
    /** `/` */
    Slash = 47,
    /** `%` */
    Percent = 37,
    /** `<` */
    Lower = 60,
    /** `>` */
    Greater = 62,
    /** `&` */
    And = 38,
    /** `^` */
    Caret = 94,
    /** `|` */
    Pipe = 124,
    /** `?` */
    Question = 63,
    /** `:` */
    Colon = 58,
    /** `=` */
    Equal = 61,
    /** `,` */
    Comma = 44,
    /** `;` */
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
    /** `_` */
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

/**
 * List of GLSL keywords (ESSL 1.0/3.0), for internal use only.
 * 
 * Plain strings are error-prone. This enables auto-completion
 * of keywords.
 */
export const enum ____Keyword {
    Const = "const",
    Uniform = "uniform",
    Layout = "layout",
    Centroid = "centroid",
    Flat = "flat",
    Smooth = "smooth",
    Break = "break",
    Continue = "continue",
    Do = "do",
    For = "for",
    While = "while",
    Switch = "switch",
    Case = "case",
    Default = "default",
    If = "if",
    Else = "else",
    In = "in",
    Out = "out",
    Inout = "inout",
    Float = "float",
    Int = "int",
    Void = "void",
    Bool = "bool",
    True = "true",
    False = "false",
    Invariant = "invariant",
    Discard = "discard",
    Return = "return",
    Mat2 = "mat2",
    Mat3 = "mat3",
    Mat4 = "mat4",
    Mat2x2 = "mat2x2",
    Mat2x3 = "mat2x3",
    Mat2x4 = "mat2x4",
    Mat3x2 = "mat3x2",
    Mat3x3 = "mat3x3",
    Mat3x4 = "mat3x4",
    Mat4x2 = "mat4x2",
    Mat4x3 = "mat4x3",
    Mat4x4 = "mat4x4",
    Vec2 = "vec2",
    Vec3 = "vec3",
    Vec4 = "vec4",
    IVec2 = "ivec2",
    IVec3 = "ivec3",
    IVec4 = "ivec4",
    BVec2 = "bvec2",
    BVec3 = "bvec3",
    BVec4 = "bvec4",
    UInt = "uint",
    UVec2 = "uvec2",
    UVec3 = "uvec3",
    UVec4 = "uvec4",
    Lowp = "lowp",
    Mediump = "mediump",
    Highp = "highp",
    Precision = "precision",
    Sampler2D = "sampler2D",
    Sampler3D = "sampler3D",
    SamplerCube = "samplerCube",
    Sampler2DShadow = "sampler2DShadow",
    SamplerCubeShadow = "samplerCubeShadow",
    Sampler2DArray = "sampler2DArray",
    Sampler2DArrayShadow = "sampler2DArrayShadow",
    ISampler2D = "isampler2D",
    ISampler3D = "isampler3D",
    ISamplerCube = "isamplerCube",
    ISampler2DArray = "isampler2DArray",
    USampler2D = "usampler2D",
    USampler3D = "usampler3D",
    USamplerCube = "usamplerCube",
    USampler2DArray = "usampler2DArray",
    Struct = "struct",
    Attribute = "attribute",
    Varying = "varying",
    Coherent = "coherent",
    Restrict = "restrict",
    Readonly = "readonly",
    Writeonly = "writeonly",
    Resource = "resource",
    Atomic_uint = "atomic_uint",
    Noperspective = "noperspective",
    Patch = "patch",
    Sample = "sample",
    Subroutine = "subroutine",
    Common = "common",
    Partition = "partition",
    Active = "active",
    Asm = "asm",
    Class = "class",
    Union = "union",
    Enum = "enum",
    Typedef = "typedef",
    Template = "template",
    This = "this",
    Goto = "goto",
    Inline = "inline",
    Noinline = "noinline",
    Volatile = "volatile",
    Public = "public",
    Static = "static",
    Extern = "extern",
    External = "external",
    Interface = "interface",
    Long = "long",
    Short = "short",
    Double = "double",
    Half = "half",
    Fixed = "fixed",
    Unsigned = "unsigned",
    Superp = "superp",
    Input = "input",
    Output = "output",
    HVec2 = "hvec2",
    HVec3 = "hvec3",
    HVec4 = "hvec4",
    DVec2 = "dvec2",
    DVec3 = "dvec3",
    DVec4 = "dvec4",
    FVec2 = "fvec2",
    FVec3 = "fvec3",
    FVec4 = "fvec4",
    Sampler3DRect = "sampler3DRect",
    Filter = "filter",
    Image1D = "image1D",
    Image2D = "image2D",
    Image3D = "image3D",
    ImageCube = "imageCube",
    IImage1D = "iimage1D",
    IImage2D = "iimage2D",
    IImage3D = "iimage3D",
    IImageCube = "iimageCube",
    UImage1D = "uimage1D",
    UImage2D = "uimage2D",
    UImage3D = "uimage3D",
    UImageCube = "uimageCube",
    Image1DArray = "image1DArray",
    Image2DArray = "image2DArray",
    IImage1DArray = "iimage1DArray",
    IImage2DArray = "iimage2DArray",
    UImage1DArray = "uimage1DArray",
    UImage2DArray = "uimage2DArray",
    ImageBuffer = "imageBuffer",
    IImageBuffer = "iimageBuffer",
    UImageBuffer = "uimageBuffer",
    Sampler1D = "sampler1D",
    Sampler1DShadow = "sampler1DShadow",
    Sampler1DArray = "sampler1DArray",
    Sampler1DArrayShadow = "sampler1DArrayShadow",
    ISampler1D = "isampler1D",
    ISampler1DArray = "isampler1DArray",
    USampler1D = "usampler1D",
    USampler1DArray = "usampler1DArray",
    Sampler2DRect = "sampler2DRect",
    Sampler2DRectShadow = "sampler2DRectShadow",
    ISampler2DRect = "isampler2DRect",
    USampler2DRect = "usampler2DRect",
    SamplerBuffer = "samplerBuffer",
    ISamplerBuffer = "isamplerBuffer",
    USamplerBuffer = "usamplerBuffer",
    Sampler2DMS = "sampler2DMS",
    ISampler2DMS = "isampler2DMS",
    USampler2DMS = "usampler2DMS",
    Sampler2DMSArray = "sampler2DMSArray",
    ISampler2DMSArray = "isampler2DMSArray",
    USampler2DMSArray = "usampler2DMSArray",
    Sizeof = "sizeof",
    Cast = "cast",
    Namespace = "namespace",
    Using = "using"
}