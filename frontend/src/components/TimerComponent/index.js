import React from "react";
import useCountdown from "./useCountdown";
import Notifcation from "./Notification";
import ShowCounter from "./ShowCounter";
import "./styles.css";

const CountdownTimer = ({ targetDate, sceneTime }) => {
  const [time, setTime] = React.useState(
    new Date().setSeconds(new Date().getSeconds() + sceneTime)
  );

  React.useEffect(() => {
    setTime(targetDate);
  }, [targetDate]);

  const [days, hours, minutes, seconds] = useCountdown(time);

  if (days + hours + minutes + seconds <= 0) {
    return <Notifcation setTime={setTime} sceneTime={sceneTime} />;
  }

  return <ShowCounter minutes={minutes} seconds={seconds} />;
};

export default CountdownTimer;
