// DraggableScene.js
import React from "react";
import { useDrag } from "react-dnd";

const DraggableScene = ({ scene, index, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "SCENE",
    item: { index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    begin: () => {
      onDragStart(index);
    },
  });

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {/* Render your scene component here */}
      {/* For example: <div>{scene.name}</div> */}
    </div>
  );
};

export default DraggableScene;