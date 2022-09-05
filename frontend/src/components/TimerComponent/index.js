import React, { useState, useEffect } from "react";
/* import useCountdown from "./useCountdown"; */
import Notification from "./Notification";
import ShowCounter from "./ShowCounter";
import "./styles.css";
import getReturnValues from "./useCountdown";

const CountdownTimer = ({ targetDate, sceneTime }) => {
  let [days, hours, minutes, seconds] = [0, 0, 0, 0];
  let tempTargetDate = targetDate;
  let countDownDate = new Date(tempTargetDate).getTime();

  const [countDown, setCountDown] = useState(
    countDownDate - new Date().getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date().getTime();
      console.log(countDownDate);
      if (countDownDate > currentDate) {
        setCountDown(countDownDate - currentDate);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [countDownDate]);

  function resetCounter() {
    tempTargetDate = new Date().setSeconds(new Date().getSeconds() + sceneTime);
    countDownDate = new Date(tempTargetDate).getTime();
    setCountDown(countDownDate - new Date().getTime());
  }

  function getTimeLeft() {
    [days, hours, minutes, seconds] = getReturnValues(countDown);
    return days + hours + minutes + seconds;
  }

  function getMinutes() {
    [days, hours, minutes, seconds] = getReturnValues(countDown);
    return minutes;
  }

  function getSeconds() {
    [days, hours, minutes, seconds] = getReturnValues(countDown);
    return seconds;
  }

  if (getTimeLeft(countDown) <= 0) {
    return <Notification resetFunc={resetCounter} />;
  }

  return <ShowCounter minutes={getMinutes()} seconds={getSeconds()} />;
};

export default CountdownTimer;
