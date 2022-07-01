import React from "react";
import useCountdown from "./useCountdown";
import Notifcation from "./Notification";
import ShowCounter from "./ShowCounter";
import "./styles.css";

const CountdownTimer = ({ targetDate }) => {
  const [days, hours, minutes, seconds] = useCountdown(targetDate);

  if (days + hours + minutes + seconds <= 0) {
    return <Notifcation />;
  }

  return <ShowCounter minutes={minutes} seconds={seconds} />;
};

export default CountdownTimer;
