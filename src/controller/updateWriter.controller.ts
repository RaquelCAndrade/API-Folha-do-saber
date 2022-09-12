import { Request, Response } from "express"
import updateWriterService from "../service/updateWriter.service"

const updateWriterController = async (req: Request, res: Response) => {
    const { id } = req.params
    const { bio, profileImage } = req.body

    await updateWriterService(id, bio, profileImage)

    return res.status(200).json({ message: "Writer updated" })
}

export default updateWriterController
