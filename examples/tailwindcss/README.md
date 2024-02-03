# Tailwind CSS Example

## Using Tailwind CSS in Multiple Plugins

If you're using `kirbyup` with Tailwind CSS in multiple plugins and the latter one uses the same classes as the one loaded earlier, your responsive Tailwind classes might stop working, since Kirby will merge the CSS of all plugins into one CSS file.

Example:

```css
/* first-plugin/index.css */
.p-2 {
}
.lg\:p-4 {
}

/* second-plugin/index.css */
.p-2 {
}
```

Now, the element with `p-2 lg:p4` from the first plugin will stay at `p-2`, since the second plugin redefines the `p-2` class much later in the resulting `index.css` file.

**Solution**: Prefix the latter (second) plugin with a custom Tailwind prefix, so the CSS classes won't collide:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.vue'],
  // Circumvent colliding class names for multiple plugins using Tailwind CSS
  prefix: 'my-plugin-',
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
```

> [!NOTE]
> Remember to prefix your CSS classes in your Vue components as well, e.g. `class="my-plugin-p-2 my-plugin-lg:p-4"`.
