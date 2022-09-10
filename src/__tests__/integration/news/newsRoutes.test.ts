import { DataSource } from "typeorm"
import AppDataSource from "../../../data-source"
import request from "supertest"
import app from "../../../app"
import {
    mockedAdm,
    mockedAdmLogin,
    mockedNews,
    mockedUser,
    mockedUserLogin,
    mockedWriter
} from "../../mocks"
import { IWriter, ResponseLogin } from "../../../interfaces/users"
import { INews } from "../../../interfaces/news"

let adminLoginResponse: ResponseLogin
let userWriterLoginResp: ResponseLogin
let writer: IWriter
let userLoginResponse: ResponseLogin
let news: INews

describe("Tests News routes", () => {
    let connection: DataSource

    beforeAll(async () => {
        await AppDataSource.initialize()
            .then((resp) => {
                connection = resp
            })
            .catch((error) => {
                console.error("Error during Data Source initializatio", error)
            })

        await request(app).post("/users").send(mockedAdm)
        await request(app).post("/users").send(mockedUser)

        adminLoginResponse = await request(app)
            .post("/login")
            .send(mockedAdmLogin)

        userWriterLoginResp = await request(app)
            .post("/login")
            .send(mockedUserLogin)
        mockedWriter.userId = userWriterLoginResp.body.id

        const writerResponse = await request(app)
            .post("/writer")
            .set("Authorization", `Bearer ${adminLoginResponse.body.token}`)
            .send(mockedWriter)
        writer = writerResponse.body

        userLoginResponse = await request(app).post("/login").send({
            email: "tonho@gmail.com",
            name: "Tonho",
            password: "1234"
        })
    })

    afterAll(async () => {
        await connection.destroy()
    })

    test("POST /news  -  Admin must be able to create a new", async () => {
        mockedNews.writerId = writer.id
        const response = await request(app)
            .post("/news")
            .set("Authorization", `Bearer ${adminLoginResponse.body.token}`)
            .send(mockedNews)

        news = response.body

        expect(response.body).toHaveProperty("writer")
        expect(response.body).toHaveProperty("category")
        expect(response.body).toHaveProperty("title")
        expect(response.body).toHaveProperty("subtitle")
        expect(response.body).toHaveProperty("body")
        expect(response.body).toHaveProperty("urlImage")
        expect(response.body).toHaveProperty("createdAt")
        expect(response.body).toHaveProperty("updatedAt")
        expect(response.status).toBe(201)
    })

    test("POST /news  -  Writer must be able to create a new", async () => {
        mockedNews.writerId = writer.id
        const response = await request(app)
            .post("/news")
            .set("Authorization", `Bearer ${userWriterLoginResp.body.token}`)
            .send(mockedNews)

        expect(response.body).toHaveProperty("writer")
        expect(response.body).toHaveProperty("category")
        expect(response.body).toHaveProperty("title")
        expect(response.body).toHaveProperty("subtitle")
        expect(response.body).toHaveProperty("body")
        expect(response.body).toHaveProperty("urlImage")
        expect(response.body).toHaveProperty("createdAt")
        expect(response.body).toHaveProperty("updatedAt")
        expect(response.status).toBe(201)
    })

    test("POST /news -  Must not be able to create a new without valid token", async () => {
        const response = await request(app)
            .post("/news")
            .set("Authorization", `Bearer ${userLoginResponse.body.token}`)
            .send(mockedNews)

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(401)
    })

    test("POST /news -  Must not be able to create a new without a token", async () => {
        const response = await request(app).post("/news").send(mockedNews)

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(401)
    })

    test("GET /news  -  Must be able to return all news", async () => {
        const response = await request(app).get("/news")

        expect(response.body).toHaveProperty("map")
        expect(response.status).toBe(200)
    })

    test("GET - /news/:id  -  Must be able to return news by id", async () => {
        const news = await request(app).get("/news")
        const response = await request(app).get(`/news/${news.body[0].id}`)

        expect(response.body).toHaveProperty("writer")
        expect(response.body).toHaveProperty("category")
        expect(response.body).toHaveProperty("title")
        expect(response.body).toHaveProperty("subtitle")
        expect(response.body).toHaveProperty("body")
        expect(response.body).toHaveProperty("urlImage")
        expect(response.body).toHaveProperty("createdAt")
        expect(response.body).toHaveProperty("updatedAt")
        expect(response.status).toBe(200)
    })

    test("GET /news/:id - Must not be able to list news without a valid id", async () => {
        const response = await request(app).get(
            "/news/25698547-5cds-423b-8a8d-5c23b35846kp"
        )

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(404)
    })

    test("GET /news/:categoryId/categories - Must be able list all news of selected category", async () => {
        const news = await request(app).get("/news")
        const response = await request(app).get(
            `/news/${news.body[0].category.id}/categories`
        )

        expect(response.body).toHaveProperty("map")
        expect(response.status).toBe(200)
    })

    test("GET /news/:categoryId/categories - Must not be able list all news without valid category", async () => {
        const response = await request(app).get(
            `/news/25698547-5cds-423b-8a8d-5c23b35846kp/categories`
        )

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(404)
    })

    test("GET /news/:writerId/writers - Must be able list all news of selected writer", async () => {
        const news = await request(app).get("/news")
        const response = await request(app).get(
            `/news/${news.body[0].writer.id}/writers`
        )

        expect(response.body).toHaveProperty("map")
        expect(response.status).toBe(200)
    })

    test("GET /news/:writerId/writers - Must not be able list all news without valid writer", async () => {
        const response = await request(app).get(
            `/news/25698547-5cds-423b-8a8d-5c23b35846kp/writers`
        )

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(404)
    })

    test("PATCH /news/:id - Admin must be able to change news data", async () => {
        const response = await request(app)
            .patch(`/news/${news.id}`)
            .set("Authorization", `Bearer ${adminLoginResponse.body.token}`)
            .send({ title: "Lagarta come folhas - Admin" })

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(200)
    })

    test("PATCH /news/:id - Writer must be able to change his own news", async () => {
        const response = await request(app)
            .patch(`/news/${news.id}`)
            .set("Authorization", `Bearer ${userWriterLoginResp.body.token}`)
            .send({ title: "Lagarta come folhas - Admin" })

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(200)
    })

    test("PATCH /news/:id - Must not be able to change news data without a valid token", async () => {
        const response = await request(app)
            .patch(`/news/${news.id}`)
            .set("Authorization", `Bearer ${userLoginResponse.body.token}`)
            .send({ title: "Lagarta come folhas - Admin" })

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(401)
    })

    test("PATCH /news/:id - Must not be able to change news data without a token", async () => {
        const response = await request(app)
            .patch(`/news/${news.id}`)
            .send({ title: "Lagarta come folhas - Admin" })

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(401)
    })

    test("PATCH /news/:id - Must not be able to change news data without a valid id", async () => {
        const response = await request(app)
            .patch(`/news/25698547-5cds-423b-8a8d-5c23b35846kp`)
            .set("Authorization", `Bearer ${userWriterLoginResp.body.token}`)
            .send({ title: "Lagarta come folhas - Admin" })

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(404)
    })

    test("DELETE /news/:id - Admin must be able to delete news", async () => {
        const response = await request(app)
            .delete(`/news/${news.id}`)
            .set("Authorization", `Bearer ${adminLoginResponse.body.token}`)

        expect(response.status).toBe(204)
    })

    test("DELETE /news/:id - Writer must be able to delete his own news", async () => {
        const response = await request(app)
            .delete(`/news/${news.id}`)
            .set("Authorization", `Bearer ${userWriterLoginResp.body.token}`)

        expect(response.status).toBe(204)
    })

    test("DELETE /news/:id - Must not be able to delete news without a valid token", async () => {
        const response = await request(app)
            .delete(`/news/${news.id}`)
            .set("Authorization", `Bearer ${userLoginResponse.body.token}`)

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(401)
    })

    test("DELETE /news/:id - Must not be able to delete news without a token", async () => {
        const response = await request(app).delete(`/news/${news.id}`)

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(401)
    })

    test("DELETE /news/:id - Must not be able to delete news without a valid id", async () => {
        const response = await request(app)
            .delete(`/news/25698547-5cds-423b-8a8d-5c23b35846kp`)
            .set("Authorization", `Bearer ${userWriterLoginResp.body.token}`)

        expect(response.body).toHaveProperty("message")
        expect(response.status).toBe(404)
    })
})
