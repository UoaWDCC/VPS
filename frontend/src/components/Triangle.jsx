export default function Triangle({
  triangleWidth,
  triangleHeight,
  colour = "red",
  additionalStyles,
  ref,
}) {
  return (
    <div
      style={{
        ...additionalStyles,

        boxSizing: "border-box",
        borderLeft: `${triangleWidth}px solid transparent`,
        borderBottom: `${triangleHeight}px solid ${colour}`,

        position: "absolute",
        bottom: 0,
        right: 0,
      }}
      ref={ref}
    />
  );
}
