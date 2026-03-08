# Right Click Menus

## Portal

The portal component that the context menus render in is `<ContextMenuPortal>`, which is placed in the app root. The component just keeps the current menu, if any, in its state and renders it within a positioning container.

The `portal.jsx` file exposes `render()` and `unrender()` for changing the current menu in the portal. There’s also a `handle()` function that’s intended to wrap a menu action so that it unrenders the menu component before executing the action.

## Right Click Menu

The `<RightClickMenu>` component wraps the element you want to be right clickable, and accepts a menu parameter. This parameter should receive a react element (not a function but an actual element), which will be the menu displayed on right click. The element itself isn’t enforced so you can actually render anything you want to the screen, just make to handle unrendering for clicks within the element.
