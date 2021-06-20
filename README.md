# GLSL++

A superset of *GLSL* that transpiles to it.

Valid *GLSL* (specifically *ESSL 3.0*) are also valid *GLSL++* programs. It enhances *GLSL* with the following:
* Modules
* Templates
* Enhanced standard library
* Vertex and Fragment stages in the same file
* Better error messages
* Type-safe alternatives for preprocessor directives

The transpiler is written in TypeScript. Performance is a primary concern, *GLSL++* will never be the bottleneck of your build pipeline. The transpiler is compatible with both Node.js and modern browser environments.