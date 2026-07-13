import { HttpStatusCode } from "axios";
import { auth as firebaseAuth } from "../firebase/firebase.js";

/**
 * Verify user firebase token
 * @param {*} req  must contain authorization header
 */
export default async function auth(req, res, next) {
  if (!req.headers.authorization) {
    res.sendStatus(HttpStatusCode.Unauthorized);
    return;
  }

  const token = req.headers.authorization.split(" ")[1];
  firebaseAuth
    .verifyIdToken(token)
    .then((decoded) => {
      const { uid } = decoded;
      req.body.uid = uid;
      next();
    })
    .catch(() => res.sendStatus(HttpStatusCode.Unauthorized));
}
