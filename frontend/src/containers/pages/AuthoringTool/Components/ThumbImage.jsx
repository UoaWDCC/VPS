const scale = (percentages, max) => {
  return percentages.map((p) => (p / 100) * max);
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
      if (testLine.length * (fontSize - 9) > width) {
        lines.push(word);
      } else {
        lines[lines.length - 1] = testLine;
      }
    }
  }
  return lines;
};

const TextEl = ({ text, fontSize, x, y, w, colour }) => (
  <text x={x + 10} y={y + 10} fill={colour || "black"}>
    {lineGen({ text, fontSize, width: w - 20 }).map((line) => (
      <tspan key={line} x={x + 10} dy="1.2em">
        {line}
      </tspan>
    ))}
  </text>
);

const changeLater = { fill: "white", stroke: "black", strokeWidth: 3 };

const Button = ({ c, x, y, w, h }) => {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} {...changeLater} fill={c.colour} />
      <TextEl text={c.text} fontSize={16} x={x} y={y} w={w} />
    </g>
  );
};

const TextBox = ({ c, x, y, w, h }) => {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} {...changeLater} />
      <TextEl text={c.text} fontSize={16} x={x} y={y} w={w} />
    </g>
  );
};

const Image = ({ c, x, y, w, h }) => {
  return <g>{/* <image href={c.url} x={x} y={y} width={w} height={h} /> */}</g>;
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
      <TextEl text={c.text} fontSize={16} x={x} y={y} w={w} colour={c.color} />
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
    case "FIREBASEIMAGE":
      return <Image key={component.id} c={component} {...dims} />;
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
