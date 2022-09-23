import { Router } from "express";
import {
  retrieveAllUser,
  createUser,
  retrieveUser,
  deleteUser,
  addPlayed,
} from "../../db/daos/userDao";

const router = Router();

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

//gets all users
router.get("/", async (req, res) => {
  const dashboard = await retrieveAllUser();
  res.json(dashboard);
});

//get user by uid
router.get("/:uid", async (req, res) => {
  const user = await retrieveUser(req.params.uid);
  res.json(user);
});

//creats new user
router.post("/", async (req, res) => {
  const { name, uid, email, pictureURL } = req.body;

  const user = await createUser(name, uid, email, pictureURL);

  res.status(HTTP_OK).json(user);
});

//delete user by uid
router.delete("/:uid", async (req, res) => {
  const deleted = await deleteUser(req.params.uid);
  if (deleted) {
    res.sendStatus(HTTP_NO_CONTENT);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

//update user's played array
router.put("/:uid", async (req, res) => {
  const scenarioID = Object.values(req.body)[0];
  const added = await addPlayed(req.params.uid, req.body, scenarioID);
  if (added) {
    res.status(HTTP_OK).json(added);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

export default router;
