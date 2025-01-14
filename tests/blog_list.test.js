const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const helper = require('./blog_list_helper')

let token = ''

beforeEach(async () => {
  await User.deleteMany({})
  await Blog.deleteMany({})

  const responseUserCreated = await api.post('/api/users').send({
    username: 'root',
    name: 'Superuser',
    password: 'salainen',
  })

  const user = await User.findOne({ username: 'root' })
  const userToken = {
    username: user.username,
    id: user._id,
  }

  token = jwt.sign(userToken, process.env.SECRET)

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Blog prueba',
      url: 'http://blogprueba.com',
      author: 'Autor Prueba',
    })
    .expect(201)
})

const api = supertest(app)

test('correct amount of blogs', async () => {
  const response = await helper.blogsInDb()

  assert.strictEqual(1, response.length)
})

test('likes should be initialized to 0', async () => {
  const newBlog = {
    title: 'Clone wars',
    url: 'clonewars.com/conanDoyle',
    author: 'Monica dominguez',
  }

  const response = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const likes = response.body.likes

  assert.strictEqual(likes, 0)
})

test('blog without title should return 400 response code', async () => {
  const newBlog = {
    author: 'Monica dominguez',
    url: 'clonewars.com/conanDoyle',
  }

  const response = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.statusCode, 400)
})

test('blog without url should return 400 response code', async () => {
  const newBlog = {
    title: 'Clone wars',
    author: 'Monica dominguez',
  }

  const response = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.statusCode, 400)
})

test('blog should be correctly deleted by its id', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  const titles = blogsAtEnd.map((b) => b.title)
  assert(!titles.includes(blogToDelete.title))

  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)
})

test('blog should be updated correctly', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToUpdate = blogsAtStart[0]

  const updatedBlog = { ...blogToUpdate, likes: 123 }

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send(updatedBlog)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  const likesFromUpdated = blogsAtEnd[0].likes
  assert.notStrictEqual(blogToUpdate.likes, likesFromUpdated)
  assert.strictEqual(likesFromUpdated, updatedBlog.likes)
})

test('add or update a blog without a valid token should return 401 unauthorized', async () => {
  const newBlog = {
    title: 'Clone wars',
    url: 'clonewars.com/conanDoyle',
    author: 'Monica dominguez',
  }

  const response = await api.post('/api/blogs').send(newBlog).expect(401)

  assert.strictEqual(response.status, 401)
})

after(async () => {
  await mongoose.connection.close()
})
