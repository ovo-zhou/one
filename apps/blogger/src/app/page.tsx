import getBlog from "../actions/blog/getBlog";

export default async function Home() {
  const blog=await getBlog()
  console.log(blog)
  return (
    <main>
      <pre> {JSON.stringify(blog,null,2)}</pre>
    </main>
  );
}
