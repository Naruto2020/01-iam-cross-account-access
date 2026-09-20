
===============================================================================================

## 01 — CDK Generated an Invalid TypeScript Stack Identifier

==============================================================================================


### Problem

When the CDK project was initialized using the project name `01-iam-cross-account-access`, CDK generated a stack class name beginning with `01`.

The generated identifier was similar to:

```text id="d6l3jf"
01IamCrossAccountAccessStack
```

When running:

```bash
npm run build
```

the TypeScript compiler returned syntax errors.

### Investigation

The issue was caused by the generated **TypeScript identifier** starting with a number.

Although numbers are valid in file names and directory names, a TypeScript class or variable identifier cannot begin with a number.

### Root Cause

The CDK project name was converted into a TypeScript class name, producing an invalid identifier beginning with `01`.

### Solution

The stack class was renamed to:

```text id="2y3zuw"
WorkloadStack
```

The corresponding import and references were updated accordingly.

After the change, the TypeScript project built successfully and the CDK stack could be synthesized.

### Lesson Learned

CDK project names and TypeScript identifiers follow different naming rules.

A project directory can contain a name such as:

```text
01-iam-cross-account-access
```

while the corresponding TypeScript class must use a valid identifier such as:

```text
WorkloadStack
```

This also reinforced the importance of running `npm run build` early after initializing a CDK project.
