const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs)
})

blogsRouter.post('/', (request, response) => {
  const blog = new Blog(request.body)

  if (!blog.title || !blog.author || !blog.url || !blog.likes) {
    return response.status(400).json({ error: 'malformed request' })
  }

  blog.save().then((result) => {
    response.status(201).json(result)
  })
})

module.exports = blogsRouter
