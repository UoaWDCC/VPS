import React from "react";
import useCountdown from "./useCountdown";
import Notification from "./Notification";
import ShowCounter from "./ShowCounter";
import "./styles.css";

const CountdownTimer = ({ targetDate, scene }) => {
  const [days, hours, minutes, seconds] = useCountdown(targetDate);

  if (days + hours + minutes + seconds <= 0) {
    return <Notification scene={scene} />;
  }

  return <ShowCounter minutes={minutes} seconds={seconds} />;
};

export default CountdownTimer;
