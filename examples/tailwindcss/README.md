# Tailwind CSS Example

## ℹ Using Tailwind CSS in Multiple Plugins

If you're using `kirbyup` with Tailwind CSS in two separate plugins and the latter one uses the same classes as the one loaded earlier, your responsive Tailwind classes might stop working, since Kirby will merge the CSS of all plugins into one CSS file.

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

**Solution**: Prefix the latter (second) plugin with a custom Tailwind prefix, so the CSS classes won't collide.
