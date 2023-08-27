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
  const totalTime = days + hours + minutes + seconds;

  if (totalTime <= 0) {
    return <Notification setTime={setTime} sceneTime={sceneTime} />;
  }
  return (
    <div>
      {totalTime > 25 && totalTime <= 30 && <PopUp seconds={seconds} />}

      {totalTime > 10 && totalTime <= 15 && <PopUp seconds={seconds} />}

      <ShowCounter minutes={minutes} seconds={seconds} />
    </div>
  );
};

export default CountdownTimer;
