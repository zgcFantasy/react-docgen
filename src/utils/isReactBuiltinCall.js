/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import isReactModuleName from './isReactModuleName';
import match from './match';
import resolveToModule from './resolveToModule';
import resolveToValue from './resolveToValue';
import type { Importer } from '../types';

/**
 * Returns true if the expression is a function call of the form
 * `React.foo(...)`.
 */
export default function isReactBuiltinCall(
  path: NodePath,
  name: string,
  importer: Importer,
): boolean {
  if (t.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (match(path.node, { callee: { property: { name } } })) {
    const module = resolveToModule(path.get('callee', 'object'), importer);
    return Boolean(module && isReactModuleName(module));
  }

  if (t.CallExpression.check(path.node)) {
    const value = resolveToValue(path.get('callee'), importer);
    if (value === path.get('callee')) return false;

    if (
      // `require('react').createElement`
      (t.MemberExpression.check(value.node) &&
        t.Identifier.check(value.get('property').node) &&
        value.get('property').node.name === name) ||
      // `import { createElement } from 'react'`
      (t.ImportDeclaration.check(value.node) &&
        value.node.specifiers.some(
          specifier => specifier.imported && specifier.imported.name === name,
        ))
    ) {
      const module = resolveToModule(value, importer);
      return Boolean(module && isReactModuleName(module));
    }
  }

  return false;
}
