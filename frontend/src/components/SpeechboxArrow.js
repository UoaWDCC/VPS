import React from "react";
import Triangle from "components/Triangle";

const SpeechTextboxArrow = React.memo(({ borderWidth }) => {
  const arrowHeight = 25; // px
  const arrowWidth = 25; // px

  /**
   * The angle being calculated here is the one that is opposite the horizontal or vertical line in the arrow/triangle
   * @returns {number} angle - in radians
   */
  function calculateAngleInArrow() {
    return Math.atan2(arrowHeight, arrowWidth);
  }

  /**
   * The arrow is made of one or two triangles
   * If there is a border on the component, then a 2nd larger triangle will be placed behind the 1st to imitate a border
   * The difference in widths of these triangles has to be found so that the perpendicular distance between the two triangles is same as component border
   *
   * @returns {number} widthOffset - in px
   */
  function calculateBorderTriangleWidth() {
    const arrowAngle = calculateAngleInArrow();
    return (
      borderWidth +
      arrowWidth +
      borderWidth / Math.cos(Math.PI / 2 - arrowAngle)
    );
  }

  /**
   * same as width offset calculator but for height
   */
  function calculateBorderTriangleHeight() {
    const arrowAngle = calculateAngleInArrow();
    return (
      arrowHeight +
      borderWidth / Math.sin(Math.PI / 2 - arrowAngle) +
      borderWidth * Math.tan(arrowAngle)
    );
  }

  const borderTriangleWidth = calculateBorderTriangleWidth();
  const borderTriangleHeight = calculateBorderTriangleHeight();

  return (
    <div
      style={{
        position: "relative",
        height: borderTriangleHeight,
        marginBottom: -borderWidth,
      }}
    >
      {/* border (of arrow) triangle */}
      <Triangle
        triangleHeight={borderTriangleHeight}
        triangleWidth={borderTriangleWidth}
        colour="black"
      />

      {/* arrow triangle */}
      <Triangle
        triangleHeight={arrowHeight}
        triangleWidth={arrowWidth}
        colour="white"
        additionalStyles={{ marginRight: borderWidth }}
      />
    </div>
  );
});

export default SpeechTextboxArrow;
