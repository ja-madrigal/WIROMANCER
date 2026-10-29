# Wiromancer Component Registry

Wiromancer components are defined in `app/src/components.js`.

The current registry is JavaScript data, not arbitrary third-party plugin execution. That keeps the editor static-hostable and keeps Markdown export deterministic while giving the app one place to describe component metadata, placement defaults, and renderer behavior.

## Definition Shape

Each component definition has:

- `id`: stable identifier saved on canvas objects.
- `name`: label shown in tools and layers.
- `icon`: compact tool/layer icon.
- `renderer`: ASCII renderer primitive used by `app/src/ascii.js`.
- `defaults`: default instance values for `w`, `h`, and `text`.
- `props`: editable property metadata for future inspector work.

Example:

```js
component("button", "Button", "▭", "button", { w: 10, h: 1, text: "OK" })
```

## Groups

Tool rail placement is controlled by `groups`:

```js
{
  id: "uiTools",
  name: "UI Elements",
  components: ["button", "input", "card"]
}
```

The group `id` maps to an existing tool-list container in `app/index.html`.

## Current Renderer Primitives

Available renderer values currently include:

- `text`
- `box`
- `line`
- `arrow`
- `button`
- `input`
- `checkbox`
- `radio`
- `dropdown`
- `toggle`
- `tabs`
- `search`
- `progress`
- `breadcrumb`
- `pagination`
- `navbar`
- `list`
- `placeholder`
- `split`
- `image`
- `card`
- `table`
- `modal`

## Custom Library Direction

The next step is to load additional component libraries beside the core registry. A safe first version should support data-only component libraries that reuse known renderer primitives.

Later, Wiromancer can add a developer mode for custom renderer functions, but that should stay separate from ordinary component data so hosted versions remain predictable and safe.
