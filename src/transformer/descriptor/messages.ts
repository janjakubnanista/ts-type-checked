export const functionTypeWarning = (typeName: string): string => `

It looks like you are trying to type check a function-like value (${typeName}). 
Due to very nature of JavaScript it's not possible to see what the return type of a function is
or what the signature of a function was.

ts-type-checked can only check whether something is of type function, nothing more. Sorry :(

`;

export const promiseTypeWarning = (typeName: string): string => `

It looks like you are trying to type check a Promise-like value (${typeName}). 
Although possible, type checking Promises is discouraged in favour of wrapping the value in a new Promise:

const certainlyPromise = Promise.resolve(value);

Check https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise for more information.

`;
