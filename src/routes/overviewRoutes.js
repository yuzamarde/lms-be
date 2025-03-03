import express from "express"
import { getOverviews } from "../controllers/overviewController.js"
import { verifyToken } from "../middlewares/verifyToken.js"


const overviewRoutes = express.Router()

overviewRoutes.get('/overviews', verifyToken, getOverviews)

export default overviewRoutes