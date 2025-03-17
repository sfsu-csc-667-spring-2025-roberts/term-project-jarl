import express from 'express';

const router = express.Router();

router.get("/", (request, response, next) => {
    response.send("Hello World from route root.ts!");
})

export default router;