import { useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

function StaffAuth() {
  const [isStaff, setAsStaff] = useState(false);

  function checkIfStaff(email) {
    const splitEmail = email.split("@");
    const emailDomain = splitEmail[1];

    return emailDomain === "auckland.ac.nz";
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setAsStaff(checkIfStaff(user.email));
    } else {
      setAsStaff(false);
    }
  });

  return isStaff;
}

export default StaffAuth;
