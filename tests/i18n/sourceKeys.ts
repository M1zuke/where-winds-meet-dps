import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import ts from "typescript"

const SOURCE_ROOT = join(import.meta.dirname, "..", "..", "src")
const UI_ROOT = join(SOURCE_ROOT, "ui")

const DISPLAY_PROPERTIES = new Set([
  "ariaLabel",
  "displayName",
  "hint",
  "label",
  "meta",
  "name",
  "note",
  "placeholder",
  "subNote",
  "text",
  "title",
  "weapon",
])

type Seed = { kind: "binding" | "function"; name: string }

interface Module {
  path: string
  directKeys: string[]
  displayKeys: string[]
  seeds: Seed[]
  declarations: Map<string, ts.Node>
  importedFrom: Map<string, string>
}

function sourcePaths(directory: string): string[] {
  const paths: string[] = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) paths.push(...sourcePaths(path))
    else if (/\.tsx?$/.test(path)) paths.push(path)
  }
  return paths
}

function parse(path: string): ts.SourceFile {
  return ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.ESNext,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
}

function resolveSpecifier(fromPath: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null
  const base = resolve(dirname(fromPath), specifier)
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ])
    if (existsSync(candidate)) return candidate
  return null
}

function isStringNode(node: ts.Node): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
}

const VALUE_OPERATORS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.PlusToken,
])

function stringValuesIn(node: ts.Node): string[] {
  const values: string[] = []
  const visit = (child: ts.Node): void => {
    if (isStringNode(child)) {
      values.push(child.text)
      return
    }
    if (ts.isPropertyAssignment(child)) {
      visit(child.initializer)
      return
    }
    if (ts.isConditionalExpression(child)) {
      visit(child.whenTrue)
      visit(child.whenFalse)
      return
    }
    if (ts.isBinaryExpression(child)) {
      if (!VALUE_OPERATORS.has(child.operatorToken.kind)) return
      visit(child.left)
      visit(child.right)
      return
    }
    ts.forEachChild(child, visit)
  }
  visit(node)
  return values
}

function returnedStringsIn(node: ts.Node): string[] {
  const values: string[] = []
  const visit = (child: ts.Node): void => {
    if (ts.isReturnStatement(child) && child.expression)
      values.push(...stringValuesIn(child.expression))
    ts.forEachChild(child, visit)
  }
  visit(node)
  return values
}

function seedsOf(expression: ts.Expression, directKeys: string[]): Seed[] {
  if (isStringNode(expression)) {
    directKeys.push(expression.text)
    return []
  }
  if (ts.isIdentifier(expression)) return [{ kind: "binding", name: expression.text }]
  if (ts.isCallExpression(expression))
    return ts.isIdentifier(expression.expression)
      ? [{ kind: "function", name: expression.expression.text }]
      : []
  if (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression))
    return seedsOf(expression.expression, directKeys)
  if (ts.isParenthesizedExpression(expression) || ts.isNonNullExpression(expression))
    return seedsOf(expression.expression, directKeys)
  if (ts.isBinaryExpression(expression))
    return [...seedsOf(expression.left, directKeys), ...seedsOf(expression.right, directKeys)]
  if (ts.isConditionalExpression(expression))
    return [
      ...seedsOf(expression.whenTrue, directKeys),
      ...seedsOf(expression.whenFalse, directKeys),
    ]
  return []
}

function readModule(path: string): Module {
  const sourceFile = parse(path)
  const isUiFile = path.startsWith(UI_ROOT)
  const module: Module = {
    path,
    directKeys: [],
    displayKeys: [],
    seeds: [],
    declarations: new Map(),
    importedFrom: new Map(),
  }

  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name) && declaration.initializer)
          module.declarations.set(declaration.name.text, declaration.initializer)
    if (ts.isFunctionDeclaration(statement) && statement.name && statement.body)
      module.declarations.set(statement.name.text, statement.body)
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const target = resolveSpecifier(path, statement.moduleSpecifier.text)
      const bindings = statement.importClause?.namedBindings
      if (target && bindings && ts.isNamedImports(bindings))
        for (const element of bindings.elements) module.importedFrom.set(element.name.text, target)
    }
  }

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "t" &&
      node.arguments.length > 0
    ) {
      module.seeds.push(...seedsOf(node.arguments[0], module.directKeys))
    }
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(sourceFile) === "T") {
      for (const child of node.children) {
        if (ts.isJsxText(child) && child.text.trim()) module.directKeys.push(child.text.trim())
        if (ts.isJsxExpression(child) && child.expression && isStringNode(child.expression))
          module.directKeys.push(child.expression.text)
      }
    }
    if (
      isUiFile &&
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      DISPLAY_PROPERTIES.has(node.name.text) &&
      isStringNode(node.initializer)
    ) {
      module.displayKeys.push(node.initializer.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  return module
}

function declarationFor(
  module: Module,
  byPath: Map<string, Module>,
  seed: Seed,
): ts.Node | undefined {
  const own = module.declarations.get(seed.name)
  if (own) return own
  const importedPath = module.importedFrom.get(seed.name)
  return importedPath ? byPath.get(importedPath)?.declarations.get(seed.name) : undefined
}

export function collectStaticKeys(): string[] {
  const modules = sourcePaths(SOURCE_ROOT).map(readModule)
  const byPath = new Map(modules.map((module) => [module.path, module]))

  const keys = new Set<string>()
  for (const module of modules) {
    for (const key of module.directKeys) keys.add(key)
    for (const key of module.displayKeys) keys.add(key)
    for (const seed of module.seeds) {
      const declaration = declarationFor(module, byPath, seed)
      if (!declaration) continue
      const values =
        seed.kind === "function" ? returnedStringsIn(declaration) : stringValuesIn(declaration)
      for (const value of values) keys.add(value)
    }
  }
  return [...keys]
}
