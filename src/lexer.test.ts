
import { Token, __Kind } from "./token";
import { Lexer } from "./lexer";

const t = (k: number, l: string) => new Token(l, k, 0, l.length);
const sc = t(__Kind.Semicolon, ";");
const lp = t(__Kind.LeftParen, "(");
const rp = t(__Kind.RightParen, ")");
const lbc = t(__Kind.LeftBrace, "{");
const rbc = t(__Kind.RightBrace, "}");
// const lbk = t(__Kind.LeftBracket, "[");
// const rbk = t(__Kind.RightBracket, "]");
const h = t(__Kind.Hash, "#");
// const bs = t(__Kind.BackSlash, "\\");
const eq = t(__Kind.Equal, "=");
const c = t(__Kind.Comma, ",");
const sub = t(__Kind.Minus, "-");
// const add = t(__Kind.Plus, "+");
const div = t(__Kind.Slash, "/");
const mul = t(__Kind.Star, "*");
const d = t(__Kind.Dot, ".");
const id = (l: TemplateStringsArray) => t(__Kind.Identifier, l[0]);
const n = (l: TemplateStringsArray) => t(__Kind.Number, l[0]);
const lc = (l: TemplateStringsArray) => t(__Kind.LineComment, l[0]);
const bc = (l: TemplateStringsArray) => t(__Kind.BlockComment, l[0]);
const ws = (l: TemplateStringsArray) => t(__Kind.Whitespace, l[0]);
const nl = t(__Kind.NewLine, "\n");
const sp = ws` `;

describe("Lexer", () => {
    it("Whitespace", () => {
        const source = [
            "                ",
            " \t\r\v\v\f       \v\f  ",
        ].join("\n");
        const expected: Token[] = [
            ws`                `, nl,
            ws` \t\r\v\v\f       \v\f  `,
        ];
        const actual = [...new Lexer(source)];
        expect(actual.map(t => t.toString())).toEqual(expected.map(t => t.toString()));
    });
    // Tests that lexer correctly processes numbers
    it.each([
        ["100.001", n`100.001`],
        ["100.", n`100.`],
        [".001", n`.001`],
        ["100.001e100", n`100.001e100`],
        ["100.e100", n`100.e100`],
        [".001e100", n`.001e100`],
        ["100.001e-100", n`100.001e-100`],
        ["100.e-100", n`100.e-100`],
        [".001e-100", n`.001e-100`],
        ["100.001e+100", n`100.001e+100`],
        ["100.e+100", n`100.e+100`],
        [".001e+100", n`.001e+100`],
        ["100.001f", n`100.001f`],
        ["100.f", n`100.f`],
        [".001f", n`.001f`],
        ["100.001e100f", n`100.001e100f`],
        ["100.e100f", n`100.e100f`],
        [".001e100f", n`.001e100f`],
        ["100.001e-100f", n`100.001e-100f`],
        ["100.e-100f", n`100.e-100f`],
        [".001e-100f", n`.001e-100f`],
        ["100.001e+100f", n`100.001e+100f`],
        ["100.e+100f", n`100.e+100f`],
        [".001e+100f", n`.001e+100f`],
        ["100", n`100`],
        ["100u", n`100u`],
        ["0100", n`0100`],
        ["0x7fff", n`0x7fff`],
    ])("Numeric literal", (source: string, expected: Token) => {
        const actual = new Lexer(source).next();
        expect(actual).not.toBeNull();
        expect(actual!.toString()).toEqual(expected.toString());
    });
    // Tests that lexer correctly processes operators
    it.each([
        ["(", t(__Kind.LeftParen, "(")],
        [")", t(__Kind.RightParen, ")")],
        ["[", t(__Kind.LeftBracket, "[")],
        ["]", t(__Kind.RightBracket, "]")],
        [";", t(__Kind.Semicolon, ";")],
        ["{", t(__Kind.LeftBrace, "{")],
        ["}", t(__Kind.RightBrace, "}")],
        ["\\", t(__Kind.BackSlash, "\\")],
        ["#", t(__Kind.Hash, "#")],
        [".", t(__Kind.Dot, ".")],
        ["+", t(__Kind.Plus, "+")],
        ["++", t(__Kind.PlusPlus, "++")],
        ["+=", t(__Kind.PlusEqual, "+=")],
        ["-", t(__Kind.Minus, "-")],
        ["--", t(__Kind.MinusMinus, "--")],
        ["-=", t(__Kind.MinusEqual, "-=")],
        ["~", t(__Kind.Tilde, "~")],
        ["!=", t(__Kind.BangEqual, "!=")],
        ["*", t(__Kind.Star, "*")],
        ["*=", t(__Kind.StarEqual, "*=")],
        ["/", t(__Kind.Slash, "/")],
        ["/=", t(__Kind.SlashEqual, "/=")],
        ["%", t(__Kind.Percent, "%")],
        ["%=", t(__Kind.PercentEqual, "%=")],
        ["<", t(__Kind.Lower, "<")],
        ["<=", t(__Kind.LowerEqual, "<=")],
        ["<<", t(__Kind.LowerLower, "<<")],
        ["<<=", t(__Kind.LowerLowerEqual, "<<=")],
        [">", t(__Kind.Greater, ">")],
        [">=", t(__Kind.GreaterEqual, ">=")],
        [">>", t(__Kind.GreaterGreater, ">>")],
        [">>=", t(__Kind.GreaterGreaterEqual, ">>=")],
        ["==", t(__Kind.EqualEqual, "==")],
        ["&", t(__Kind.And, "&")],
        ["&&", t(__Kind.AndAnd, "&&")],
        ["&=", t(__Kind.AndEqual, "&=")],
        ["^", t(__Kind.Caret, "^")],
        ["^^", t(__Kind.CaretCaret, "^^")],
        ["^=", t(__Kind.CaretEqual, "^=")],
        ["|", t(__Kind.Pipe, "|")],
        ["||", t(__Kind.PipePipe, "||")],
        ["|=", t(__Kind.PipeEqual, "|=")],
        ["?", t(__Kind.Question, "?")],
        [":", t(__Kind.Colon, ":")],
        [",", t(__Kind.Comma, ",")],
    ])("Non-alphanumeric", (source: string, expected: Token) => {
        const actual = new Lexer(source).next();
        expect(actual).not.toBeNull();
        expect(actual!.toString()).toEqual(expected.toString());
    });

    // The following fragments of a shader are from https://gist.github.com/galek/53557375251e1a942dfa, (c) 2015 Nick Galko, MIT license
    const fragments = [
        [[
            "layout(std140) uniform Transforms",
            "{",
            "    mat4x4 world_matrix;  // object's world position",
            "    mat4x4 view_matrix;   // view (camera) transform",
            "    mat4x4 proj_matrix;   // projection matrix",
            "    mat3x3 normal_matrix; // normal transformation matrix ( transpose(inverse(W * V)) )",
            "};",
            "layout(std140) uniform Material",
            "{",
            "    vec4 material; // x - metallic, y - roughness, w - \"rim\" lighting",
            "    vec4 albedo;   // constant albedo color, used when textures are off",
            "};",
        ], [
            id`layout`, lp, id`std140`, rp, sp, id`uniform`, sp, id`Transforms`, nl,
            lbc, nl,
            ws`    `, id`mat4x4`, sp, id`world_matrix`, sc, ws`  `, lc`// object's world position\n`,
            ws`    `, id`mat4x4`, sp, id`view_matrix`, sc, ws`   `, lc`// view (camera) transform\n`,
            ws`    `, id`mat4x4`, sp, id`proj_matrix`, sc, ws`   `, lc`// projection matrix\n`,
            ws`    `, id`mat3x3`, sp, id`normal_matrix`, sc, sp, lc`// normal transformation matrix ( transpose(inverse(W * V)) )\n`,
            rbc, sc, nl,
            id`layout`, lp, id`std140`, rp, sp, id`uniform`, sp, id`Material`, nl,
            lbc, nl,
            ws`    `, id`vec4`, sp, id`material`, sc, sp, lc`// x - metallic, y - roughness, w - \"rim\" lighting\n`,
            ws`    `, id`vec4`, sp, id`albedo`, sc, ws`   `, lc`// constant albedo color, used when textures are off\n`,
            rbc, sc,
        ]],
        [[
            "uniform samplerCube envd;  // prefiltered env cubemap",
            "uniform sampler2D tex;     // base texture (albedo)",
            "uniform sampler2D norm;    // normal map",
            "uniform sampler2D spec;    // \"factors\" texture (G channel used as roughness)",
            "uniform sampler2D iblbrdf; // IBL BRDF normalization precalculated tex",
            "#define PI 3.1415926",
            "// constant light position, only one light source for testing (treated as point light)",
            "const vec4 light_pos = vec4(-2, 3, -2, 1);",
        ], [
            id`uniform`, sp, id`samplerCube`, sp, id`envd`, sc, ws`  `, lc`// prefiltered env cubemap\n`,
            id`uniform`, sp, id`sampler2D`, sp, id`tex`, sc, ws`     `, lc`// base texture (albedo)\n`,
            id`uniform`, sp, id`sampler2D`, sp, id`norm`, sc, ws`    `, lc`// normal map\n`,
            id`uniform`, sp, id`sampler2D`, sp, id`spec`, sc, ws`    `, lc`// \"factors\" texture (G channel used as roughness)\n`,
            id`uniform`, sp, id`sampler2D`, sp, id`iblbrdf`, sc, sp, lc`// IBL BRDF normalization precalculated tex\n`,
            h, id`define`, sp, id`PI`, sp, n`3.1415926`, nl,
            lc`// constant light position, only one light source for testing (treated as point light)\n`,
            id`const`, sp, id`vec4`, sp, id`light_pos`, sp, eq, sp, id`vec4`, lp, sub, n`2`, c, sp, n`3`, c, sp, sub, n`2`, c, sp, n`1`, rp, sc
        ]],
        [[
            "// compute fresnel specular factor for given base specular and product",
            "// product could be NdV or VdH depending on used technique",
            "vec3 fresnel_factor(in vec3 f0, in float product)",
            "{",
            "    return mix(f0, vec3(1.0), pow(1.01 - product, 5.0));",
            "}",
            "// following functions are copies of UE4",
            "// for computing cook-torrance specular lighting terms",
        ], [
            lc`// compute fresnel specular factor for given base specular and product\n`,
            lc`// product could be NdV or VdH depending on used technique\n`,
            id`vec3`, sp, id`fresnel_factor`, lp, id`in`, sp, id`vec3`, sp, id`f0`, c, sp, id`in`, sp, id`float`, sp, id`product`, rp, nl,
            lbc, nl,
            ws`    `, id`return`, sp, id`mix`, lp, id`f0`, c, sp, id`vec3`, lp, n`1.0`, rp, c, sp, id`pow`, lp, n`1.01`, sp, sub, sp, id`product`, c, sp, n`5.0`, rp, rp, sc, nl,
            rbc, nl,
            lc`// following functions are copies of UE4\n`,
            lc`// for computing cook-torrance specular lighting terms`,
        ]],
        [[
            "float D_beckmann(in float roughness, in float NdH)",
            "{",
            "    float m = roughness * roughness;",
            "    float m2 = m * m;",
            "    float NdH2 = NdH * NdH;",
            "    return exp((NdH2 - 1.0) / (m2 * NdH2)) / (PI * m2 * NdH2 * NdH2);",
            "}",
        ], [
            id`float`, sp, id`D_beckmann`, lp, id`in`, sp, id`float`, sp, id`roughness`, c, sp, id`in`, sp, id`float`, sp, id`NdH`, rp, nl,
            lbc, nl,
            ws`    `, id`float`, sp, id`m`, sp, eq, sp, id`roughness`, sp, mul, sp, id`roughness`, sc, nl,
            ws`    `, id`float`, sp, id`m2`, sp, eq, sp, id`m`, sp, mul, sp, id`m`, sc, nl,
            ws`    `, id`float`, sp, id`NdH2`, sp, eq, sp, id`NdH`, sp, mul, sp, id`NdH`, sc, nl,
            ws`    `, id`return`, sp, id`exp`, lp, lp, id`NdH2`, sp, sub, sp, n`1.0`, rp, sp, div, sp, lp, id`m2`, sp, mul, sp, id`NdH2`, rp, rp, sp, div, sp, lp, id`PI`, sp, mul, sp, id`m2`, sp, mul, sp, id`NdH2`, sp, mul, sp, id`NdH2`, rp, sc, nl,
            rbc
        ]],
        [[
            "/* simple phong specular calculation with normalization */",
            "vec3 phong_specular(in vec3 V, in vec3 L, in vec3 N, in vec3 specular, in float roughness)",
            "{",
            "    vec3 R = reflect(-L, N);",
            "    float spec = max(0.0, dot(V, R));",
            "    float k = 1.999 / (roughness * roughness);",
            "    return min(1.0, 3.0 * 0.0398 * k) * pow(spec, min(10000.0, k)) * specular;",
            "}",
        ], [
            bc`/* simple phong specular calculation with normalization */`, nl,
            id`vec3`, sp, id`phong_specular`, lp, id`in`, sp, id`vec3`, sp, id`V`, c, sp, id`in`, sp, id`vec3`, sp, id`L`, c, sp, id`in`, sp, id`vec3`, sp, id`N`, c, sp, id`in`, sp, id`vec3`, sp, id`specular`, c, sp, id`in`, sp, id`float`, sp, id`roughness`, rp, nl,
            lbc, nl,
            ws`    `, id`vec3`, sp, id`R`, sp, eq, sp, id`reflect`, lp, sub, id`L`, c, sp, id`N`, rp, sc, nl,
            ws`    `, id`float`, sp, id`spec`, sp, eq, sp, id`max`, lp, n`0.0`, c, sp, id`dot`, lp, id`V`, c, sp, id`R`, rp, rp, sc, nl,
            ws`    `, id`float`, sp, id`k`, sp, eq, sp, n`1.999`, sp, div, sp, lp, id`roughness`, sp, mul, sp, id`roughness`, rp, sc, nl,
            ws`    `, id`return`, sp, id`min`, lp, n`1.0`, c, sp, n`3.0`, sp, mul, sp, n`0.0398`, sp, mul, sp, id`k`, rp, sp, mul, sp, id`pow`, lp, id`spec`, c, sp, id`min`, lp, n`10000.0`, c, sp, id`k`, rp, rp, sp, mul, sp, id`specular`, sc, nl,
            rbc
        ]],
        [[
            "// albedo/specular base",
            "#if USE_ALBEDO_MAP",
            "vec3 base = texture2D(tex, texcoord).xyz;",
            "#else",
            "vec3 base = albedo.xyz;",
            "#endif",
        ], [
            lc`// albedo/specular base\n`,
            h, id`if`, sp, id`USE_ALBEDO_MAP`, nl,
            id`vec3`, sp, id`base`, sp, eq, sp, id`texture2D`, lp, id`tex`, c, sp, id`texcoord`, rp, d, id`xyz`, sc, nl,
            h, id`else`, nl,
            id`vec3`, sp, id`base`, sp, eq, sp, id`albedo`, d, id`xyz`, sc, nl,
            h, id`endif`
        ]],
    ] as [string[], Token[]][];
    // Tests that lexer's output is as expected
    it.each(fragments)("Sample shader fragments", (source: string[], expected: Token[]) => {
        const actual = [...new Lexer(source.join("\n"))];
        expect(actual).not.toHaveLength(0);
        expect(actual.map(t => t.toString())).toEqual(expected.map(t => t.toString()));
    });
    // Tests that joining lexemes of tokens *after* lexing source will produce the same source.
    it.each(fragments)("Preservation", (source: string[]) => {
        const actual = [...new Lexer(source.join("\n"))];
        expect(actual.map(v => v.lexeme).join("")).toEqual(source.join("\n"));
    });
});