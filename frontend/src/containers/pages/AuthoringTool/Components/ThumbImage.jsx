import { useGet } from "hooks/crudHooks";
import { useState } from "react";

const scale = (percentages, max) => {
  return percentages.map((p) => (p / 100) * max);
};

const getTextWidth = (text, font = "400 16px Arial") => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  return context.measureText(text).width;
};

const lineGen = ({ text, fontSize, width }) => {
  const lines = [];
  const textA = text.split(" ");
  // eslint-disable-next-line no-restricted-syntax
  for (const word of textA) {
    if (!lines.length) {
      lines.push(word);
    } else {
      const lastLine = lines[lines.length - 1];
      const testLine = `${lastLine} ${word}`;
      if (getTextWidth(testLine) >= width) {
        lines.push(word);
      } else {
        lines[lines.length - 1] = testLine;
      }
    }
  }
  return lines;
};

const TextEl = ({ text, fontSize, x, y, w, colour, ...props }) => (
  <text x={x} y={y} fill={colour || "black"} {...props}>
    {lineGen({ text, fontSize, width: w - 40 }).map((line, i) => (
      <tspan key={line} x={x + 10} dy={i ? "1.2em" : ""}>
        {line}
      </tspan>
    ))}
  </text>
);

const changeLater = { fill: "white", stroke: "black", strokeWidth: 3 };

const Button = ({ c, x, y, w, h }) => {
  const newX = x + w / 2;
  const newY = y + h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="0.5rem" fill={c.colour} />
      <TextEl
        text={c.text}
        fontSize={16}
        x={newX}
        y={newY}
        w={w}
        fill={c.colour !== "white" ? "white" : "black"}
        dominantBaseline="middle"
        textAnchor="middle"
      />
    </g>
  );
};

const TextBox = ({ c, x, y, w, h }) => {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} {...changeLater} />
      <TextEl text={c.text} fontSize={16} x={x} y={y + 25} w={w} />
    </g>
  );
};

const FBImage = ({ c, x, y, w, h }) => {
  return (
    <g>
      <image href={c.url || ""} x={x} y={y} width={w} height={h} />
    </g>
  );
};

const Image = ({ c, x, y, w, h }) => {
  const [image, setImage] = useState();
  useGet(`/api/image/${c.imageId}`, setImage, false);

  return (
    <g>
      <image href={image?.url || ""} x={x} y={y} width={w} height={h} />
    </g>
  );
};

const positions = {
  top: [0, -1 / 5, 1 / 10, 0],
  right: [9 / 10, 0, 1, 1 / 5],
  bottom: [1, 6 / 5, 9 / 10, 1],
  left: [1 / 10, 1, 0, 6 / 5],
};

const SpeechBox = ({ c, x, y, w, h }) => {
  const t = positions[c.arrowLocation];
  const tString = `${x + w * t[0]},${y + h * t[1]} ${x + w * t[2]},${
    y + h * t[3]
  }`;

  const d =
    c.arrowLocation === "top" || c.arrowLocation === "right"
      ? `M${x},${y} ${tString} ${x + w},${y} ${x + w},${y + h} ${x},${y + h} Z`
      : `M${x},${y} ${x + w},${y} ${x + w},${y + h} ${tString} ${x},${y + h} Z`;

  return (
    <g>
      <path d={d} {...changeLater} />
      <TextEl
        text={c.text}
        fontSize={16}
        x={x}
        y={y + 25}
        w={w}
        colour={c.color}
      />
    </g>
  );
};

const ThumbElement = ({ component }) => {
  const { top, left, width, height } = component;
  const [x, w] = scale([left, width], 1920);
  const [y, h] = scale([top, height], 1080);

  const dims = { x, y, w, h };

  switch (component.type) {
    case "SPEECHTEXT":
      return <SpeechBox key={component.id} c={component} {...dims} />;
    case "TEXT":
      return <TextBox key={component.id} c={component} {...dims} />;
    case "BUTTON":
    case "RESET_BUTTON":
      return <Button key={component.id} c={component} {...dims} />;
    case "IMAGE":
      return <Image key={component.id} c={component} {...dims} />;
    case "FIREBASEIMAGE":
      return <FBImage key={component.id} c={component} {...dims} />;
    default:
      return null;
  }
};

const ThumbImage = ({ components }) => {
  return (
    <svg viewBox="0 0 1920 1080" width="160px">
      <rect x="0" y="0" width="1920" height="1080" fill="white" />
      {components.map((c) => (
        <ThumbElement key={c.id} component={c} />
      ))}
    </svg>
  );
};

export default ThumbImage;
