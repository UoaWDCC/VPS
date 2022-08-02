import React, { useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

function StaffAuth() {
  const [isStaff, setAsStaff] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  function checkIfStaff(email) {
    const splitEmail = email.split("@");
    const emailDomain = splitEmail[1];

    // TODO: CHANGE DOMAIN TO AUCKLAND.AC.NZ
    return emailDomain === "aucklanduni.ac.nz";
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setUserEmail(user.email);
      setAsStaff(checkIfStaff(user.email));
      console.log(isStaff);
    } else {
      setUserEmail("");
      setAsStaff(false);
    }
  });

  return userEmail;
}

export default StaffAuth;
