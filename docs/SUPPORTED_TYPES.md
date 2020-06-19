<h1>
  <img height="56px" width="auto" src="https://raw.githubusercontent.com/janjakubnanista/ts-type-checked/main/res/ts-type-checked.png" align="center"/>
  <span>ts-type-checked</span>
</h1>

<a href="https://github.com/janjakubnanista/ts-type-checked">&lt; Back to project</a>

# Supported types

`ts-type-checked` supports (reasonably large but still only) a subset of TypeScript features:

<table width="100%" cellpadding="4">
  <thead>
    <tr>
      <th align="left">Type&nbsp;/&nbsp;feature</th>
      <th align="center">Support</th>
      <th align="left">Notes</th>
      <th align="left">Implementation</th>
    </tr>
  </thead>

  <tbody>
    <!-- Primitive types -->
    <tr valign="top">
      <td align="left">
        <code>bigint</code>,<br/>
        <code>boolean</code>,<br/>
        <code>number</code>,<br/>
        <code>string</code>,<br/>
        <code>symbol</code>
      </td>
      <td align="center">✓</td>
      <td align="left">Primitive types that can be checked using the <code>typeof</code> operator</td>
      <td align="left">
        <code>typeof value === 'bigint'</code>,<br/>
        <code>typeof value === 'boolean'</code>,<br/>
        <code>typeof value === 'number'</code>,<br/>
        <code>typeof value === 'string'</code>,<br/>
        <code>typeof value === 'symbol'</code>
      </td>
    </tr>
    <!-- Boxed types -->
    <tr valign="top">
      <td align="left">
        <code>BigInt</code>,<br/>
        <code>Boolean</code>,<br/>
        <code>Number</code>,<br/>
        <code>String</code>,<br/>
        <code>Symbol</code>
      </td>
      <td align="center">✓</td>
      <td align="left">Boxed types are converted to their un-boxed versions and checked accordingly</td>
      <td align="left">
        <code>typeof value === 'bigint'</code>,<br/>
        <code>typeof value === 'boolean'</code>,<br/>
        <code>typeof value === 'number'</code>,<br/>
        <code>typeof value === 'string'</code>,<br/>
        <code>typeof value === 'symbol'</code>
      </td>
    </tr>
    <!-- object keyword -->
    <tr valign="top">
      <td align="left">
        <code>object</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        All non-primitives (See description of the object type <a href="https://www.typescriptlang.org/docs/handbook/basic-types.html#object">here</a>)
      </td>
      <td align="left">
        <code>typeof value === 'function' || (typeof value === 'object' && value !== null)</code>
      </td>
    </tr>
    <!-- Object interface -->
    <tr valign="top">
      <td align="left">
        <code>Object</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        All objects that inherit from <code>Object</code> (i.e. everything except for <code>null</code> and <code>undefined</code>) and implement the <code>Object</code> interface.
        <br/>
        <br/>
        Check the definition of the <code>Object</code> interface here <a href="https://github.com/microsoft/TypeScript/blob/main/src/lib/es5.d.ts">here</a>
      </td>
      <td align="left">
        <code>value !== null && value !== undefined && typeof value.toString === 'function' && ...</code>
      </td>
    </tr>
    <!-- Date -->
    <tr valign="top">
      <td align="left">
        <code>Date</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Date objects
      </td>
      <td align="left">
        <code>value instanceof Date</code>
      </td>
    </tr>
    <!-- Set -->
    <tr valign="top">
      <td align="left">
        <code>Set&lt;T&gt;</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        ES6 Sets
        <br/>
        <br/>
        <code>Array.from</code> and <code>Array.every</code> methods are used so they need to be available.
      </td>
      <td align="left">
        <code>(value instanceof Set) && Array.from(value.values()).every(value => isA&lt;T&gt;(value))</code>
      </td>
    </tr>
    <!-- Map -->
    <tr valign="top">
      <td align="left">
        <code>Map&lt;K, V&gt;</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        ES6 Maps
        <br/>
        <br/>
        <code>Array.from</code> and <code>Array.every</code> methods are used so they need to be available.
      </td>
      <td align="left">
        <code>(value instanceof Map) && Array.from(value.entries()).every(entry => isA&lt;K&gt;(entry[0]) && isA&lt;V&gt;(entry[1]))</code>
      </td>
    </tr>
    <!-- Interfaces -->
    <tr valign="top">
      <td align="left">
        <a id="interfaces"></a>
        <code>interface T {<br/>
          &nbsp;&nbsp;name:&nbsp;string;<br/>
          &nbsp;&nbsp;age:&nbsp;number;<br/>
          &nbsp;&nbsp;others:&nbsp;T[];<br/>
          &nbsp;&nbsp;// ...<br/>
        }</code>,
        <br/>
        <code>type T = {<br/>
          &nbsp;&nbsp;name:&nbsp;string;<br/>
          &nbsp;&nbsp;age:&nbsp;number;<br/>
          &nbsp;&nbsp;others:&nbsp;T[];<br/>
          &nbsp;&nbsp;// ...<br/>
        }</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        All objects that inherit from <code>Object</code> (i.e. everything except for <code>null</code> and <code>undefined</code>) and have all the properties of interface <code>T</code>.
        <br/>
        <br/>
        Recursive types are also supported.
      </td>
      <td align="left">
        <code>value !== null && value !== undefined && typeof value.name === 'string' && typeof value.age === 'number' && isA&lt;T[]&gt;(value.others)</code>
      </td>
    </tr>
    <!-- Classes -->
    <tr valign="top">
      <td align="left">
        <code>class A</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Classes
      </td>
      <td align="left">
        Classes are checked according to the <a href="https://en.wikipedia.org/wiki/Duck_test">duck test</a>: <em>If it walks like a duck and it quacks like a duck, then it must be a duck</em>.<br/><br/>That also means that <code>private</code> and <code>protected</code> members are not checked.
        <a href="#interfaces">See <code>interfaces</code>
      </td>
    </tr>
    <!-- Indexed types -->
    <tr valign="top">
      <td align="left">
        <code>Record&lt;string, T&gt;</code>,
        <br/>
        <code>Record&lt;number, T&gt;</code>,
        <br/>
        <code>{<br/>
          &nbsp;&nbsp;[key: string]: T;<br/>
        }</code>
        <code>{<br/>
          &nbsp;&nbsp;[key: number]: T;<br/>
        }</code>
        <code>{<br/>
          &nbsp;&nbsp;[key: number]: T;<br/>
          &nbsp;&nbsp;[key: string]: U;<br/>
        }</code>
      </td>
      <td align="center">~</td>
      <td align="left">
        All non-primitives (See description of the object type <a href="https://www.typescriptlang.org/docs/handbook/basic-types.html#object">here</a>) whose properties are assignable to <code>T</code>
        <br/>
        <br/>
        <code>Object.keys</code> and <code>Array.every</code> methods are used to check the properties so they need to be available
        <br/>
        <br/>
        <strong>The support for numeric indexes works something like this:</strong> if a key can be casted to a number (not a <code>NaN</code>) <strong>OR</strong> is equal to <code>"NaN"</code> then the value is checked against the index type.
      </td>
      <td align="left">
        <code>(typeof value === 'function' || (typeof value === 'object' && value !== null)) && Object.keys(value).every(key => isA&lt;T&gt;(value[key]))</code>
        <br/>
        <br/>
        Or for numeric indexes:
        <br/>
        <br/>
        <code>(typeof value === 'function' || (typeof value === 'object' && value !== null)) && Object.keys(value).every(key => (isNaN(parseFloat(key)) && key !== 'NaN') || isA&lt;T&gt;(value[key]))</code>
      </td>
    </tr>
    <!-- Literal types -->
    <tr valign="top">
      <td align="left">
        <code>'primary'</code>,<br/>
        <code>21</code>,<br/>
        <code>true</code>,<br/>
        <code>false</code>,<br/>
        <code>null</code>,<br/>
        <code>undefined</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Literal types
      </td>
      <td align="left">
        <code>value === 'primary'</code>,<br/>
        <code>value === 21</code>,<br/>
        <code>value === true</code>,<br/>
        <code>value === false</code>,<br/>
        <code>value === null</code>,<br/>
        <code>value === undefined</code>,<br/>
      </td>
    </tr>
    <!-- Union types -->
    <tr valign="top">
      <td align="left">
        <code>A | B</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Union types
      </td>
      <td align="left">
        <code>isA&lt;A&gt;(value) || isA&lt;B&gt;(value)</code>
      </td>
    </tr>
    <!-- Intersection types -->
    <tr valign="top">
      <td align="left">
        <code>A & B</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Intersection types
      </td>
      <td align="left">
        <code>isA&lt;A&gt;(value) && isA&lt;B&gt;(value)</code>
      </td>
    </tr>
    <!-- Generic types -->
    <tr valign="top">
      <td align="left">
        <code>Type&lt;T&gt;</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Generic types are supported provided all the type arguments (<code>T</code> in this case) are specified.<br/>
        <br/>
        What this means is that you cannot create a generic function and use the <code>isA</code> to check whether a value is assignable to a type parameter of that function.
        <br/>
        <br/>
        Conditional types are also supported as part of generic types.
      </td>
      <td align="left"></td>
    </tr>
    <!-- Array types -->
    <tr valign="top">
      <td align="left">
        <code>T[]</code>,<br/>
        <code>Array&lt;T&gt;</code>,<br/>
        <code>ReadonlyArray&lt;T&gt;</code>,<br/>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Array types are checked using <code>Array.isArray</code>, the types of elements using <code>Array.every</code> so these need to be available
      </td>
      <td align="left">
        <code>Array.isArray(value) && value.every(element => isA&lt;T&gt;(element))</code>
      </td>
    </tr>
    <!-- Tuple types -->
    <tr valign="top">
      <td align="left">
        <code>[T, U, V]</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Tuple types are checked for their length as well as the types of their members
      </td>
      <td align="left">
        <code>Array.isArray(value) && value.length === 3 && isA&lt;T&gt;(value[0]) && isA&lt;U&gt;(value[1]) && isA&lt;V&gt;(value[2])</code>
      </td>
    </tr>
    <!-- Function types -->
    <tr valign="top">
      <td align="left">
        <code>Function</code>,<br/>
        <code>(...args:&nbsp;any[])&nbsp;=>&nbsp;any</code>,<br/>
        <code>new () => {}</code>
      </td>
      <td align="center">~</td>
      <td align="left">
        <strong>The signature of the function cannot be checked (since you cannot check the return type of a function without calling it)</strong>
      </td>
      <td align="left">
        <code>typeof value === 'function'</code>
      </td>
    </tr>
    <!-- Callable interface -->
    <tr valign="top">
      <td align="left">
        <code>
          interface T {<br/>
          &nbsp;&nbsp;() => string;<br/>
          &nbsp;&nbsp;callCount: number;<br/>
          }
        </code>
      </td>
      <td align="center">~</td>
      <td align="left">
        <strong>The signature of the function cannot be checked (since you cannot check the return type of a function without calling it)</strong>
      </td>
      <td align="left">
        <code>typeof value === 'function' && typeof(value.callCount) === 'number'</code>
      </td>
    </tr>
    <!-- Promises -->
    <tr valign="top">
      <td align="left">
        <code>Promise&lt;T&gt;</code>
      </td>
      <td align="center">~</td>
      <td align="left">
        <strong>The resolution value of the promise cannot be checked.</strong>
        <br/>
        <br/>
        Checking for promise types is discouraged in favor of using the <code>Promise.resolve</code> method.
      </td>
      <td align="left">
        <code>!!value && typeof value.then === 'function' && typeof value.catch === 'function'</code>
      </td>
    </tr>
    <!-- DOM types -->
    <tr valign="top">
      <td align="left">
        <code>Node</code>,<br/>
        <code>Element</code>,<br/>
        <code>HTMLElement</code>,<br/>
        <code>HTMLDivElement</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        The global DOM classes
      </td>
      <td align="left">
        <code>value instanceof Node</code>,<br/>
        <code>value instanceof Element</code>,<br/>
        <code>value instanceof HTMLElement</code>,<br/>
        <code>value instanceof HTMLDivElement</code>
      </td>
    </tr>
    <!-- any, unknown -->
    <tr valign="top">
      <td align="left">
        <code>any</code>,<br/>
        <code>unknown</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Checks for these will always be true
      </td>
      <td align="left">
        <code>true</code>
      </td>
    </tr>
    <!-- never -->
    <tr valign="top">
      <td align="left">
        <code>never</code>
      </td>
      <td align="center">✓</td>
      <td align="left">
        Checks for <code>never</code> will always be false
      </td>
      <td align="left">
        <code>false</code>
      </td>
    </tr>
  </tbody>
</table>

### What is not supported

- **Promise resolution values** It is impossible to check what the value of a resolved promise will be
- **Function return types and signatures** It is impossible to check anything about a function apart from the fact that it is a function