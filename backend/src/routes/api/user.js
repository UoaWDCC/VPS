import { Router } from "express";
import {
  retrieveAllUser,
  createUser,
  retrieveUser,
  deleteUser,
} from "../../db/daos/userDao";

const router = Router();

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

router.get("/", async (req, res) => {
  const dashboard = await retrieveAllUser();
  res.json(dashboard);
});

router.get("/:userId", async (req, res) => {
  const user = await retrieveUser(req.params.userId);
  res.json(user);
});

router.post("/", async (req, res) => {
  const { name, uid, email } = req.body;

  const scenario = await createUser(name, uid, email);

  res.status(HTTP_OK).json(scenario);
});

router.delete("/:userId", async (req, res) => {
  const deleted = await deleteUser(req.params.userId);
  if (deleted) {
    res.sendStatus(HTTP_NO_CONTENT);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

export default router;
