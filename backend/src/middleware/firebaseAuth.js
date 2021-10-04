const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const HTTP_UNAUTHORISED = 401;

/**
 * Verify user firebase token
 * @param {*} req  must contain authorization header
 */
export default async function auth(req, res, next) {
  if (!req.headers.authorization) {
    res.sendStatus(HTTP_UNAUTHORISED);
  } else {
    const idToken = req.headers.authorization.split(" ")[1];

    admin
      .auth()
      .verifyIdToken(idToken)
      .then((token) => {
        const { uid } = token;
        req.body.uid = uid;
        next();
      })
      .catch(() => {
        res.sendStatus(HTTP_UNAUTHORISED);
      });
  }
}
