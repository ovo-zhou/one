'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Page() {
  const [dataSource, setDataSource] = useState({ total: 1 })
  const [searchParams, setSearchParams] = useState({
    kind: '',
    title: "",
    page: 1,
    pageSize: 10
  })
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setSearchParams({
      ...searchParams,
      [name]: value
    })
  }
  const handleDelete=(id)=>{
    fetch(`/admin/post/delete/${id}`,{
      method:"DELETE",
      credentials:'same-origin'
    }).then(res=>{
      return res.json()
    }).then(res=>{
      handleSearch();
    }).catch(err=>console.log(err))
  }
  const changaPage = (increment) => {

    const page = searchParams.page + increment;
    if (page <= 0 || page > dataSource.total) {
      return
    }
    setSearchParams((pre) => {
      pre.page = page;
      handleSearch();
      return { ...pre }
    })
  }
  const handleSearch = () => {
    const queryParams = Object.keys(searchParams).filter(item => !!searchParams[item]).map(item => {
      return item + '=' + searchParams[item]
    }).join('&')
    fetch(`/admin/post/list/api?${queryParams}`, {
      method: 'GET',
      credentials:'same-origin'
    }).then(res => {
      return res.json()
    }).then(res => {
      setDataSource(res)
    }).catch(err => {
      console.log(err)
    })
  }
  useEffect(() => {
    handleSearch()
  }, [])
  return <>
    <Link href='/admin/post/create'>写博客</Link>
    <div>
      <label htmlFor='kind'>类型</label>
      <select name='kind' onChange={handleChange}>
        <option value=''>全部</option>
        <option value='post'>博客</option>
        <option value='page'>页面</option>
      </select>
      <label htmlFor='kind'>标题</label>
      <input id='title' name='title' value={searchParams.title} onChange={handleChange} />
      <button onClick={handleSearch} >搜索</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>标题</th>
          <th>类型</th>
          <th>更新时间</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {
          dataSource?.data?.map((post) => {
            return <tr key={post.id}>
              <td>
                {post.id}
              </td>
              <td>
                {post.title}
              </td>
              <td>
                {post.kind}
              </td>
              <td>
                {post.updated}
              </td>
              <td>
                {post.published}
              </td>
              <td>
                <Link href={`/admin/post/edit/${post.id}`}>编辑</Link>
                <button onClick={()=>handleDelete(post.id)}>删除</button>
                <Link href={`/post/${post.id}`}>查看</Link>
              </td>
            </tr>
          })
        }
      </tbody>
    </table>
    <div>
      <span onClick={() => changaPage(-1)} style={{ marginRight: 10 }}>上一页</span>
      {searchParams.page}      每页{searchParams.pageSize}条 共{dataSource.total}页
      <span onClick={() => changaPage(1)} style={{marginLeft:10}}>下一页</span>
    </div>
  </>
}