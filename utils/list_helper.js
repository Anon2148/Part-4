const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, blog) => {
    return sum + blog.likes
  }

  return blogs.length === 0 ? 0 : blogs.reduce(reducer, 0)
}

const favouriteBlog = (blogs) => {
  return blogs.length === 0
    ? null
    : blogs.reduce(function (prev, current) {
        return prev && prev.likes > current.likes ? prev : current
      })
}

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog,
}
