## React-Moveable

This project uses [react-moveable](https://www.npmjs.com/package/react-movable) to create a draggable canvas.
The moveable component is rendered in canvas.js

### On Draggable

```
x: ${(transfromMatrix[4] * 100) / canvas.width}
y: ${(transfromMatrix[5] * 100) / canvas.height}
```

transformMatrix is a length of 6 array. The last two elements (4,5) correspond to the relative positions on the page. This is then divided by the canvas width/height to get a percentage value of the canvas.

### On Scalable

```
x-scale: ${transfromMatrix[0]}
y-scale: ${transfromMatrix[3]}
```

transformMatrix is a length of 6 array. The 1st and 4th elements (0,3) correspond to the x-scale and y-scale on the page. This will be pure CSS values that can be used to render on a larger or smaller canvas.

Note: changing the scale affects the point of origin used in draggable. More testing might need to be done to see how this will affect rendering.

### On Resize

```
const relWidth = `${(absWidth / canvas.width) * 100}%`;
const relHeight = `${(absHeight / canvas.height) * 100}%`;
```

Width and height is converted to a relative percentage of the canvas, by dividing by canvas width and height.

Note: For resizing to work correctly, the component needs to have `position: "absolute"` in its css
