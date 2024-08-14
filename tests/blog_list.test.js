const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')

const helper = require('./blog_list_helper')

beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.listWithManyBlogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }
})

const api = supertest(app)

test('correct amount of notes', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.length, helper.listWithManyBlogs.length)
})

test('correct property id name', async () => {
  const response = await api.get('/api/blogs')

  const correctFormatValues = response.body.map((r) => r.id)
  const incorrectFormatValues = response.body.map((r) => r._id)

  const realIdValues = helper.listWithManyBlogs.map((b) => b._id)
  assert.deepStrictEqual(correctFormatValues, realIdValues)
  assert.notDeepStrictEqual(incorrectFormatValues, realIdValues)
})

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'Clone wars',
    author: 'Conan Doyle',
    url: 'clonewars.com/conanDoyle',
    likes: 5,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await helper.blogsInDb()

  const titles = response.map((r) => r.title)

  assert.strictEqual(response.length, helper.listWithManyBlogs.length + 1)

  assert(titles.includes('Clone wars'))
})

test('likes should be initialized to 0', async () => {
  const newBlog = {
    title: 'Clone wars',
    author: 'Monica dominguez',
    url: 'clonewars.com/conanDoyle',
  }

  const response = await api
    .post('/api/blogs')
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
    .send(newBlog)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.statusCode, 400)
})

test('blog should be correctly deleted by its id', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  const titles = blogsAtEnd.map((b) => b.title)
  assert(!titles.includes(blogToDelete.title))

  assert.strictEqual(blogsAtEnd.length, helper.listWithManyBlogs.length - 1)
})

test('blog should be updated correctly', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToUpdate = blogsAtStart[0]

  const updatedBlog = { ...blogToUpdate, likes: 123 }

  await api.put(`/api/blogs/${blogToUpdate.id}`).send(updatedBlog).expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  const likesFromUpdated = blogsAtEnd[0].likes
  assert.notStrictEqual(blogToUpdate.likes, likesFromUpdated)
  assert.strictEqual(likesFromUpdated, updatedBlog.likes)
})

after(async () => {
  await mongoose.connection.close()
})
