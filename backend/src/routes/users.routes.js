import { Router } from "express";
import { getUserHistory, login, register, addToHistory } from "../controllers/user.controller.js";

const router = Router();

router.route("/").get((req, res) => {
    res.status(200).json({
        message: "Welcome to the User API. Available endpoints are /login and /register (POST)."
    });
});

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)

export default router;