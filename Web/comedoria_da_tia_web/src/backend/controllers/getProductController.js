import { supabase } from "../supabase/supabaseClient.js";

export async function getInfoProducts (req, res) {
    try {
        const data = await supabase.from("products").select(`*`)

        res.status(200).json(data)
    } catch (error) {
        console.log("Erro no fetching", error)
        res.status(500).json({message: "Erro interno"})
    }
}