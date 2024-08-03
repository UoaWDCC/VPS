import { Router } from "express";

const router = Router();

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;

// Create a New Resource
router.post("/resources", async (req, res) => {
    const { type, content } = req.body;
    if (!type || !content) {
      return res.status(HTTP_BAD_REQUEST).send('Bad Request');
    }
    const newResource = await createResource({ type, content });
    res.status(HTTP_CREATED).json(newResource);
  });

