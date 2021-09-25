import dotenv from "dotenv";

// eslint-disable-next-line no-var
var admin = require("firebase-admin");

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
});

export default async function auth(req, res, next) {
  const idToken = req.headers.authorization.split(" ")[1];

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((token) => {
      const { uid } = token;
      req.body.uid = uid;
      next();
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(401);
    });
}
