import * as React from "react";

const DateTimeDisplay = ({ value, type, isDanger }) => {
  return (
    <div className={isDanger ? "countdown danger" : "countdown"}>
      <p>{value}</p>
      <span>{type}</span>
    </div>
  );
};

const ShowCounter = ({ minutes, seconds }) => {
  return (
    <div className="show-counter ">
      <DateTimeDisplay value={minutes} type="Mins" isDanger={false} />
      <p>:</p>
      <DateTimeDisplay value={seconds} type="Seconds" isDanger={false} />
    </div>
  );
};

export default ShowCounter;
