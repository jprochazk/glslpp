# GLSL++

A superset of *GLSL* that transpiles to it.

It enhances *GLSL* with the following:
* Modules
* Templates
* Larger standard library
* Vertex and Fragment stages in the same file
* Better error messages
* Type-safe alternatives for preprocessor directives

Goals:
* Improve the development experience
* Save development time by avoiding common boilerplate
* Be fully compatible with ESSL 1.0 and ESSL 3.0
    * Shading languages of WebGL and WebGL2, and also WebGPU in the future

### Implementation status

* **Total**: ~25%

* Lexer: 100%
* Preprocessor: ~95%
  * Missing `#extension` handling
* Parser: 0%
* Minifier: 0%
* Emitter: 0%

### Usage

Currently not in a usable state. Most features are not yet implemented.

### Notes

* ESSL 1.0 specification: https://www.khronos.org/registry/OpenGL/specs/es/2.0/GLSL_ES_Specification_1.00.pdf
* ESSL 3.0 specification: https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf