export default async function getBlog(){
  console.log('process.env.blog_id', process.env.blog_id)
  const blog = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${process.env.blog_id}?key=${process.env.api_key}`,{
    next: { revalidate: 60*60*12 }
  })
  return await blog.json()
}