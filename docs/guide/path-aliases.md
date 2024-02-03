# Path Aliases

Import certain modules more easily by using the `~/` path alias. It will resolve to the directory of your input file, for example `src` when building `kirbyup src/index.js`.

For example, instead of handling relative paths like this:

```js
// Inside deeply nested module
import someUtility from '../../utils'
```

You can use the built-in path alias like this:

```js
import someUtility from '~/utils'
```

::: tip
The famous `@/` alias is supported as well and will resolve to the same directory as `~/`.
:::
