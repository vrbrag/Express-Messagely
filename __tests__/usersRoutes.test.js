const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message")
const { SECRET_KEY } = require("../config")

describe("User Routes Test", function () {
   let testUserToken

   beforeEach(async () => {
      await db.query("DELETE FROM messages")
      await db.query("DELETE FROM users")

      let u1 = await User.register({
         username: "test1",
         password: "password",
         first_name: "TestUser1",
         last_name: "Tester1",
         phone: "+123456789"
      })

      testUserToken = jwt.sign({ username: "test1" }, SECRET_KEY)
   })



   test("get list of users", async () => {
      let resp = await request(app)
         .get("/users")
         .send({ _token: testUserToken })
      expect(resp.body).toEqual({
         users: [
            {
               username: "test1",
               first_name: "TestUser1",
               last_name: "Tester1",
               phone: "+123456789"
            }
         ]
      })
   })

   describe("GET /users/:username", function () {
      test("get user details", async () => {
         let resp = await request(app)
            .get('/users/test1')
            .send({ _token: testUserToken })
         expect(resp.statusCode).toBe(200)

         expect(resp.body).toEqual({
            user: {
               username: "test1",
               first_name: "TestUser1",
               last_name: "Tester1",
               phone: "+123456789",
               join_at: expect.any(String),
               last_login_at: expect.any(String)
            }
         })
      })

      test("invlaid user", async () => {
         let resp = await request(app)
            .get('/users/invalid')
            .send({ _token: testUserToken })

         expect(resp.statusCode).toEqual(401)
      })
   })
})

describe("GET /users/:username/to", function () {

   let testUserToken

   beforeEach(async function () {
      await db.query("DELETE FROM messages")
      await db.query("DELETE FROM users")

      let u1 = await User.register({
         username: "test1",
         password: "password",
         first_name: "TestUser1",
         last_name: "Tester1",
         phone: "+1111111111"
      })
      let u2 = await User.register({
         username: "test2",
         password: "password2",
         first_name: "TestUser2",
         last_name: "Tester2",
         phone: "+22222222222"
      })

      let m1 = await Message.create({
         from_username: "test1",
         to_username: "test2",
         body: "test1 -> test2"
      })
      let m2 = await Message.create({
         from_username: "test2",
         to_username: "test1",
         body: "test2 -> test1"
      })

      testUserToken = jwt.sign({ username: "test1" }, SECRET_KEY)
   })

   describe("GET /users/:username/to", function () {
      test("get list of messages to user", async () => {
         let resp = await request(app)
            .get('/users/test1/to')
            .send({ _token: testUserToken })

         expect(resp.body).toEqual({
            messages: [{
               id: expect.any(Number),
               body: "test2 -> test1",
               sent_at: expect.any(String),
               read_at: null,
               from_user: {
                  username: "test2",
                  first_name: "TestUser2",
                  last_name: "Tester2",
                  phone: "+22222222222"
               }
            }]
         })
      })

      test("invalid user", async () => {
         let resp = await request(app)
            .get('/users/invalid/to')
            .send({ _token: testUserToken })
         expect(resp.statusCode).toEqual(401)
      })

      test("invalid token/auth", async () => {
         let resp = await request(app)
            .get('/users/invalid/to')
            .send({ _token: "invalid" })
         expect(resp.statusCode).toEqual(401)
      })
   })

   describe("GET /users/:username/from", function () {
      test("get list of messages from user", async () => {
         let resp = await request(app)
            .get('/users/test1/from')
            .send({ _token: testUserToken })
         expect(resp.body).toEqual({
            messages: [
               {
                  id: expect.any(Number),
                  body: "test1 -> test2",
                  sent_at: expect.any(String),
                  read_at: null,
                  to_user: {
                     username: "test2",
                     first_name: "TestUser2",
                     last_name: "Tester2",
                     phone: "+22222222222"
                  }
               }
            ]
         })
      })

      test("invalid user", async () => {
         let resp = await request(app)
            .get('/users/invalid/from')
            .send({ _token: testUserToken })
         expect(resp.statusCode).toEqual(401)
      })

      test("invalid token/auth", async () => {
         let resp = await request(app)
            .get('/users/invalid/from')
            .send({ _token: "invalid" })
         expect(resp.statusCode).toEqual(401)
      })
   })

})

afterAll(async () => {
   await db.end()
})