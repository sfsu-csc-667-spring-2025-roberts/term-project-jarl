import express from 'express';

const router = express.Router();

router.get("/", (request, response, next) => {
    // replace vars with db calls
    const title = "Jarl's site";
    const message = "Welcome to my site!";

    response.render("root", { message });
})

export default router;