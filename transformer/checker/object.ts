import { ObjectTypePropertyDescriptor, TypeName } from '../types';
import { createLogicalAndChain } from './utils';
import ts from 'typescript';

export type CreateObjectPropertyCheck = (typeName: TypeName, value: ts.Expression) => ts.Expression;

export const createIsObject = (value: ts.Expression): ts.Expression =>
  createLogicalAndChain(
    ts.createStrictEquality(ts.createTypeOf(value), ts.createLiteral('object')),
    ts.createStrictInequality(value, ts.createNull()),
  );

export const createObjectTypeCheck = (
  value: ts.Expression,
  properties: ObjectTypePropertyDescriptor[],
  stringIndexType: TypeName | undefined,
  createObjectPropertyCheck: CreateObjectPropertyCheck,
): ts.Expression => {
  const propertyChecks = properties.map(property =>
    createObjectPropertyCheck(property.type, ts.createElementAccess(value, property.accessor)),
  );

  // FIXME Add index type checks
  // const stringIndexTypeCheck

  return createLogicalAndChain(createIsObject(value), ...propertyChecks);
};

// export const createObjectPropertiesCheck = (
//   value: ts.Expression,
//   descriptor: ObjectTypeDescriptor,
//   propertyCheck: (typeName: TypeName, value: ts.Expression) => ts.Expression,
// ): ts.Expression => {
//   const propertiesCheck = descriptor.properties.length
//     ? descriptor.properties
//         .map<ts.Expression>(propertyDescriptor =>
//           ts.createParen(
//             propertyCheck(propertyDescriptor.type, ts.createElementAccess(value, propertyDescriptor.accessor)),
//           ),
//         )
//         .reduce((expression, propertyCheck) => ts.createLogicalAnd(expression, propertyCheck))
//     : undefined;

//   // TODO Maybe return undefined instead of createTrue()
//   if (!descriptor.stringIndexType) return propertiesCheck || ts.createTrue();

//   const propertyMapIdentifier = ts.createIdentifier('properties');

//   // Map of explicitly defined properties
//   const propertyMap = ts.createVariableStatement(
//     undefined /* modifiers */,
//     ts.createVariableDeclarationList(
//       [
//         ts.createVariableDeclaration(
//           propertyMapIdentifier,
//           undefined,
//           ts.createObjectLiteral(
//             descriptor.properties.map(propertyDescriptor => {
//               return ts.createPropertyAssignment(
//                 ts.createComputedPropertyName(propertyDescriptor.accessor),
//                 ts.createTrue(),
//               );
//             }),
//             true,
//           ),
//         ),
//       ],
//       ts.NodeFlags.Const,
//     ),
//   );

//   // The Object.keys(value) call
//   const objectKeysCall = ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Object'), 'keys'), [], [value]);

//   // Callback parameter for the .every(key => {}) call
//   const key = ts.createIdentifier('key');

//   // value[key] access
//   const valueForKey = ts.createElementAccess(value, key);

//   const stringIndexTypeCheck = propertyCheck(descriptor.stringIndexType, valueForKey);
//   const checkProperty = createValueCheckFunction(key =>
//     ts.createBlock([
//       propertyMap,

//       // If the property has been defined explicitly then we skip it
//       ts.createIf(ts.createElementAccess(propertyMapIdentifier, key), ts.createReturn(ts.createTrue())),

//       // If it is an indexed property then it is checked using the checks above
//       ts.createReturn(stringIndexTypeCheck),
//     ]),
//   );

//   return ts.createCall(ts.createPropertyAccess(objectKeysCall, 'every'), [], [checkProperty]);
// };
