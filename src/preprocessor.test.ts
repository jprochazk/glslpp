
import { Token } from "./token";
import { Preprocessor } from "./preprocessor";

interface Macro {
    params?: string[],
    body?: Token[],
    builtin?: boolean,
}

const preprocess = (input: string) => {
    return new Preprocessor(input).run().tokens.map(t => t.lexeme).join("");
}

const s = (...fragments: string[]) => fragments.join("\n");
const j = (...tokens: Token[]) => tokens.map(t => t.lexeme).join("");
const e = (...fragments: string[]) => {
    const p = new Preprocessor(s(...fragments));
    return p.run().errors
}

// Some code snippets are from https://gcc.gnu.org/onlinedocs/gcc-2.95.3/cpp_1.html

describe("Preprocessor", () => {
    it("Skips empty directives", () => {
        expect(preprocess(s(
            "# this will be skipped",
        ))).toEqual("");
    });

    it.each([
        [s(
            "#define TEST asdf asdf",
        ), {
            "TEST": { body: "asdf asdf" }
        }],
        [s(
            " #          define              TEST asdf asdf",
        ), {
            "TEST": { body: "asdf asdf" }
        }],
        [s(
            "#define TEST asdf asdf",
            "#undef TEST"
        ), {}],
        [s(
            " #          define              TEST asdf asdf",
            " #  undef TEST"
        ), {}],
        [[
            "#define TEST(a, b) a b",
        ].join("\n"), {
            "TEST": { params: ["a", "b"], body: "a b" }
        }],
        [[
            " #   define    TEST(   a   ,    b      )              a b",
        ].join("\n"), {
            "TEST": { params: ["a", "b"], body: "a b" }
        }],
        [[
            "#define TEST(a, b) a b",
            "#undef TEST"
        ].join("\n"), {}],
        [[
            " #   define    TEST(   a   ,    b      )              a b",
            "#undef TEST"
        ].join("\n"), {}]
    ])("Defines", (input: string, expected: { [n: string]: { params?: string[], body: string } }) => {
        const preprocessor = new Preprocessor(input);
        preprocessor.run();
        const defines = Object.fromEntries(Object.entries(
            (preprocessor as any).macros as Record<string, Macro>)
            .filter(([, { builtin }]) => builtin !== true)
            .map(([name, { params, body }]) => ([name, { params, body: body && j(...body) }])));

        expect(defines).toEqual(expected);
    });

    it.each([
        [s(
            "#define A 0",
            "#define B A",
            "#define C B A",
            "C"
        ), s(
            "0 0"
        )],
        [s(
            "#define TEST position\\",
            ".xyz",
            "TEST + TEST"
        ), s(
            "position.xyz + position.xyz"
        )],
        [s(
            "#define ID(x) x",
            "ID(ID(ID(ID(ID(test)))))"
        ), s(
            "test"
        )],
        [s(
            "#define APPLY(m, x) m(x)",
            "#define ID(x) x",
            "APPLY(ID, test)"
        ), s(
            "test"
        )],
        [s(
            "#define BUFFER_SIZE 1020",
            "foo = (char *) xmalloc (BUFFER_SIZE);"
        ), s(
            "foo = (char *) xmalloc (1020);"
        )],
        [s(
            "foo = X;",
            "#define X 4",
            "foo = X;",
        ), s(
            "foo = X;",
            "foo = 4;"
        )],
        [s(
            "#define BUFSIZE 1020",
            "#define TABLESIZE BUFSIZE",
            "TABLESIZE"
        ), s(
            "1020"
        )],
        [s(
            "#define MIN(X, Y) ((X) < (Y) ? (X) : (Y))",
            "MIN (1, 2)"
        ), s(
            "((1) < (2) ? (1) : (2))"
        )],
        [s(
            "#define double(x) (2*(x))",
            "#define call_with_1(x) x(1)",
            "call_with_1 (double)"
        ), s(
            "(2*(1))"
        )],
        [s(
            "#define foo (a, b)",
            "#define bar(x) lose((x))",
            "#define lose(x) (1 + (x))",
            "bar(foo)"
        ), s(
            "(1 + (((a, b))))"
        )]
    ])("Expands recursively", (input: string, expected: string) => {
        const actual = preprocess(input);
        if (actual !== expected) console.log(input);
        expect(actual).toEqual(expected);
    });

    it("Self-reference doesn't cause infinite recursion", () => {
        expect(preprocess(s(
            "#define A A",
            "A"
        ))).toEqual(s(
            "A"
        ));
    });

    it("Indirect self-reference doesn't cause infinite recursion", () => {
        expect(preprocess(s(
            "#define A B",
            "#define B A",
            "A"
        ))).toEqual(s(
            "A"
        ));
    });

    it.each([
        ["#error test", ["test"]],
        ["#define 0", ["Expected identifier"]],
        ["#define TEST\n#define TEST", ["Attempted to re-define macro"]],
        ["#define TEST(0)", ["Expected identifier"]],
        ["#define TEST(test yo", ["Expected closing ')'"]],
        ["#undef 0", ["Expected identifier"]],
        ["#define A(a,b) x\nA()", ["Not enough params to invoke macro"]],
        ["#define A(x) x\nA(0,0)", ["Too many params to invoke macro"]],
        ["#define A(x) x\nA(0", ["Missing 1 closing ')'"]],
        ["\n#version wrong", ["'#version' may only appear on the first line"]],
        ["#version 300 es\n#version 300 es", ["'#version' may only appear on the first line"]],
        ["#version wrong", ["Version must be one of: '100', '300 es'"]],
        ["#version 100 es", ["Version must be one of: '100', '300 es'"]],
        ["#version 300 es this is not valid", ["Version must be one of: '100', '300 es'"]],
        ["#undef GL_ES", ["Attempted to undefine builtin macro"]],
        ["#if $", ["Unexpected token"]],
        ["#if 0\n#else\n#elif 1\n#endif", ["Unexpected '#elif' after '#else'"]],
        ["#elif 1\n#endif", ["Unexpected '#elif' before '#if'", "Unexpected '#endif' before '#if'"]],
        ["#if 0\n#else\n#else\n#endif", ["Unexpected '#else' after '#else'"]],
        ["#else\n#endif", ["Unexpected '#else' before '#if'", "Unexpected '#endif' before '#if'"]],
        ["#endif", ["Unexpected '#endif' before '#if'"]]
    ])("Errors", (source: string, expected: string[]) => {
        const actual = e(source).map(e => e.message);
        // console.log(source);
        expect(actual).toEqual(expected);
    });

    it("Preserves input with no directives", () => {
        expect(preprocess("test")).toEqual("test");
    });

    it.each([
        [s(
            "#if 0",
            "A",
            "#endif"
        ), ""],
        [s(
            "#if 1",
            "A",
            "#else",
            "B",
            "#endif"
        ), "A\n"],
        [s(
            "#if 0",
            "A",
            "#else",
            "B",
            "#endif"
        ), "B\n"],
        [s(
            "#define TEST 1",
            "#if TEST",
            "A",
            "#else",
            "B",
            "#endif"
        ), "A\n"],
        [s(
            "#define TEST 0",
            "#if TEST",
            "A",
            "#else",
            "B",
            "#endif"
        ), "B\n"],
        [s(
            "#define TEST(x) x > 0",
            "#if TEST(10)",
            "A",
            "#else",
            "B",
            "#endif"
        ), "A\n"],
        [s(
            "#define TEST(x) x > 0",
            "#if TEST(-10)",
            "A",
            "#else",
            "B",
            "#endif"
        ), "B\n"],
        [s(
            "#ifdef GL_ES",
            "A",
            "#endif"
        ), "A\n"],
        [s(
            "#ifndef TEST",
            "A",
            "#endif"
        ), "A\n"]
    ])("Conditionally ignores code", (input: string, expected: string) => {
        expect(preprocess(input)).toEqual(expected);
    });

    it.each([
        [s(
            "#pragma optimize(off)",
            "#extension all : required"
        ), s(
            "#pragma optimize(off)",
            "#extension all : required"
        )]
    ])("Preserves #pragma and #extension", (input: string, expected: string) => {
        expect(preprocess(input)).toEqual(expected);
    });

    it("Ignores '#line'", () => {
        expect(preprocess(s(
            "#line adfsjko adfsjkl adfsjkl adfs",
            "test"
        ))).toEqual("test")
    });

    it.each([
        ["#version 300 es", "300"],
        ["#version 100", "100"]
    ])("Processes '#version'", (input: string, expected: string) => {
        expect(new Preprocessor(input).run().version).toEqual(expected);
    });

    it.each([
        "1 && 1",
        "0 || 1",
        "0 | 1",
        "0 ^ 1",
        "1 & 1",
        "1 == 1",
        "1 != 0",
        "1 > 0",
        "1 >= 0",
        "0 < 1",
        "0 <= 1",
        "1 << 0",
        "2 >> 1",
        "0 + 1",
        "2 - 1",
        "1 * 1",
        "2 / 2",
        "1 % 2",
        "!0",
        "-(-1)",
        "~(-2)",
        "+1",
        "((((((((((1))))))))))",
    ])("Truthy expression", (input: string) => {
        expect(preprocess(s(
            `#if ${input}`,
            "A",
            "#endif"
        ))).toEqual("A\n");
    });
});