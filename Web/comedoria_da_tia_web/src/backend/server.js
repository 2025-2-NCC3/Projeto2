import express from "express"
import dotenv from "dotenv"
import { getInfoProducts } from "./controllers/getProductController.js"


dotenv.config()

const PORT = 5001
const app = express()

app.use(express.json())

app.get("/", (req, res) => {
    res.send("Bom dia")
})

app.use("/products", getInfoProducts)

app.listen(PORT, () => {
    console.log("servidor rodando")
})