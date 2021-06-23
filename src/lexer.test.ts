
import { Lexer, Token } from "./lexer";

const t = (k: Token.Kind, l: string) => new Token(l, k, 0, l.length);
const sc = t(Token.Kind.Semicolon, ";");
const lp = t(Token.Kind.LeftParen, "(");
const rp = t(Token.Kind.RightParen, ")");
const lbc = t(Token.Kind.LeftBrace, "{");
const rbc = t(Token.Kind.RightBrace, "}");
// const lbk = t(Token.Kind.LeftBracket, "[");
// const rbk = t(Token.Kind.RightBracket, "]");
const h = t(Token.Kind.Hash, "#");
// const bs = t(Token.Kind.BackSlash, "\\");
const eq = t(Token.Kind.Equal, "=");
const c = t(Token.Kind.Comma, ".");
const sub = t(Token.Kind.Minus, "-");
// const add = t(Token.Kind.Plus, "+");
const div = t(Token.Kind.Slash, "/");
const mul = t(Token.Kind.Star, "*");
const d = t(Token.Kind.Dot, ".");
const id = (l: TemplateStringsArray) => t(Token.Kind.Identifier, l[0]);
const n = (l: TemplateStringsArray) => t(Token.Kind.Number, l[0]);

describe("Lexer", () => {
    it("Whitespace", () => {
        const actual = new Lexer([
            "                ",
            " \t\r\v\v\f       \v\f  ",
        ].join("\n")).next();
        expect(actual).toBeNull();
    });
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
    ])("Numeric literal", (source: string, expected: Token) => {
        const actual = new Lexer(source).next();
        expect(actual).not.toBeNull();
        expect(actual!.toString()).toEqual(expected.toString());
    });
    it.each([
        ["(", t(Token.Kind.LeftParen, "(")],
        [")", t(Token.Kind.RightParen, ")")],
        ["[", t(Token.Kind.LeftBracket, "[")],
        ["]", t(Token.Kind.RightBracket, "]")],
        [";", t(Token.Kind.Semicolon, ";")],
        ["{", t(Token.Kind.LeftBrace, "{")],
        ["}", t(Token.Kind.RightBrace, "}")],
        ["\\", t(Token.Kind.BackSlash, "\\")],
        ["#", t(Token.Kind.Hash, "#")],
        [".", t(Token.Kind.Dot, ".")],
        ["+", t(Token.Kind.Plus, "+")],
        ["++", t(Token.Kind.PlusPlus, "++")],
        ["+=", t(Token.Kind.PlusEqual, "+=")],
        ["-", t(Token.Kind.Minus, "-")],
        ["--", t(Token.Kind.MinusMinus, "--")],
        ["-=", t(Token.Kind.MinusEqual, "-=")],
        ["~", t(Token.Kind.Tilde, "~")],
        ["!=", t(Token.Kind.BangEqual, "!=")],
        ["*", t(Token.Kind.Star, "*")],
        ["*=", t(Token.Kind.StarEqual, "*=")],
        ["/", t(Token.Kind.Slash, "/")],
        ["/=", t(Token.Kind.SlashEqual, "/=")],
        ["%", t(Token.Kind.Percent, "%")],
        ["%=", t(Token.Kind.PercentEqual, "%=")],
        ["<", t(Token.Kind.Lower, "<")],
        ["<=", t(Token.Kind.LowerEqual, "<=")],
        ["<<", t(Token.Kind.LowerLower, "<<")],
        ["<<=", t(Token.Kind.LowerLowerEqual, "<<=")],
        [">", t(Token.Kind.Greater, ">")],
        [">=", t(Token.Kind.GreaterEqual, ">=")],
        [">>", t(Token.Kind.GreaterGreater, ">>")],
        [">>=", t(Token.Kind.GreaterGreaterEqual, ">>=")],
        ["==", t(Token.Kind.EqualEqual, "==")],
        ["&", t(Token.Kind.And, "&")],
        ["&&", t(Token.Kind.AndAnd, "&&")],
        ["&=", t(Token.Kind.AndEqual, "&=")],
        ["^", t(Token.Kind.Caret, "^")],
        ["^^", t(Token.Kind.CaretCaret, "^^")],
        ["^=", t(Token.Kind.CaretEqual, "^=")],
        ["|", t(Token.Kind.Pipe, "|")],
        ["||", t(Token.Kind.PipePipe, "||")],
        ["|=", t(Token.Kind.PipeEqual, "|=")],
        ["?", t(Token.Kind.Question, "?")],
        [":", t(Token.Kind.Colon, ":")],
        [",", t(Token.Kind.Comma, ",")],
    ])("Non-alphanumeric", (source: string, expected: Token) => {
        const actual = new Lexer(source).next();
        expect(actual).not.toBeNull();
        expect(actual!.toString()).toEqual(expected.toString());
    });

    // The following fragments of a shader are from https://gist.github.com/galek/53557375251e1a942dfa, (c) 2015 Nick Galko, MIT license
    it.each([
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
            id`layout`, lp, id`std140`, rp, id`uniform`, id`Transforms`,
            lbc,
            id`mat4x4`, id`world_matrix`, sc,
            id`mat4x4`, id`view_matrix`, sc,
            id`mat4x4`, id`proj_matrix`, sc,
            id`mat3x3`, id`normal_matrix`, sc,
            rbc, sc,
            id`layout`, lp, id`std140`, rp, id`uniform`, id`Material`,
            lbc,
            id`vec4`, id`material`, sc,
            id`vec4`, id`albedo`, sc,
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
            id`uniform`, id`samplerCube`, id`envd`, sc,
            id`uniform`, id`sampler2D`, id`tex`, sc,
            id`uniform`, id`sampler2D`, id`norm`, sc,
            id`uniform`, id`sampler2D`, id`spec`, sc,
            id`uniform`, id`sampler2D`, id`iblbrdf`, sc,
            h, id`define`, id`PI`, n`3.1415926`,
            id`const`, id`vec4`, id`light_pos`, eq, id`vec4`, lp, sub, n`2`, c, n`3`, c, sub, n`2`, c, n`1`, rp, sc
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
            id`vec3`, id`fresnel_factor`, lp, id`in`, id`vec3`, id`f0`, c, id`in`, id`float`, id`product`, rp,
            lbc,
            id`return`, id`mix`, lp, id`f0`, c, id`vec3`, lp, n`1.0`, rp, c, id`pow`, lp, n`1.01`, sub, id`product`, c, n`5.0`, rp, rp, sc,
            rbc,
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
            id`float`, id`D_beckmann`, lp, id`in`, id`float`, id`roughness`, c, id`in`, id`float`, id`NdH`, rp,
            lbc,
            id`float`, id`m`, eq, id`roughness`, mul, id`roughness`, sc,
            id`float`, id`m2`, eq, id`m`, mul, id`m`, sc,
            id`float`, id`NdH2`, eq, id`NdH`, mul, id`NdH`, sc,
            id`return`, id`exp`, lp, lp, id`NdH2`, sub, n`1.0`, rp, div, lp, id`m2`, mul, id`NdH2`, rp, rp, div, lp, id`PI`, mul, id`m2`, mul, id`NdH2`, mul, id`NdH2`, rp, sc,
            rbc
        ]],
        [[
            "// simple phong specular calculation with normalization",
            "vec3 phong_specular(in vec3 V, in vec3 L, in vec3 N, in vec3 specular, in float roughness)",
            "{",
            "    vec3 R = reflect(-L, N);",
            "    float spec = max(0.0, dot(V, R));",
            "    float k = 1.999 / (roughness * roughness);",
            "    return min(1.0, 3.0 * 0.0398 * k) * pow(spec, min(10000.0, k)) * specular;",
            "}",
        ], [
            id`vec3`, id`phong_specular`, lp, id`in`, id`vec3`, id`V`, c, id`in`, id`vec3`, id`L`, c, id`in`, id`vec3`, id`N`, c, id`in`, id`vec3`, id`specular`, c, id`in`, id`float`, id`roughness`, rp,
            lbc,
            id`vec3`, id`R`, eq, id`reflect`, lp, sub, id`L`, c, id`N`, rp, sc,
            id`float`, id`spec`, eq, id`max`, lp, n`0.0`, c, id`dot`, lp, id`V`, c, id`R`, rp, rp, sc,
            id`float`, id`k`, eq, n`1.999`, div, lp, id`roughness`, mul, id`roughness`, rp, sc,
            id`return`, id`min`, lp, n`1.0`, c, n`3.0`, mul, n`0.0398`, mul, id`k`, rp, mul, id`pow`, lp, id`spec`, c, id`min`, lp, n`10000.0`, c, id`k`, rp, rp, mul, id`specular`, sc,
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
            h, id`if`, id`USE_ALBEDO_MAP`,
            id`vec3`, id`base`, eq, id`texture2D`, lp, id`tex`, c, id`texcoord`, rp, d, id`xyz`, sc,
            h, id`else`,
            id`vec3`, id`base`, eq, id`albedo`, d, id`xyz`, sc,
            h, id`endif`
        ]],
    ])("Sample shader fragments", (source: string[], expected: Token[]) => {
        const actual = [...new Lexer(source.join("\n"))];
        expect(actual).not.toHaveLength(0);
        expect(actual.map(t => t.toString())).toEqual(expected.map(t => t.toString()));
    });
});