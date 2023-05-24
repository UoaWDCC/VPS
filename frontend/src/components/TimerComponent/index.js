import React from "react";
import useCountdown from "./useCountdown";
import Notification from "./Notification";
import PopUp from "./PopUp";
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
    return <Notification setTime={setTime} sceneTime={sceneTime} />;
  }
  return (
    <div>
      {days + hours + minutes + seconds <= 30 && <PopUp />}

      <ShowCounter minutes={minutes} seconds={seconds} />
    </div>
  );
};

export default CountdownTimer;
