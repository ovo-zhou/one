'use client'

import { use, useState } from "react"

export default function Page() {
  const [user,setUser]= useState({
    username:"",
    password:""
  })
  const handleValueChange=(e)=>{
    const name=e.target.name
    const value=e.target.value
    setUser({...user,[name]:value})
  } 
  const handleLogin=()=>{
    console.log(user)
    fetch('/login/api',{
      method:'POST',
      body:JSON.stringify(user),
      credentials:'same-origin'
    }).then(res=>res.text()).then(res=>{
      console.log(res)
    }).catch((err)=>{
      console.log(err)
    })
  }
  return <>
    <div>
      <div>
        用户名：<input type="text" name='username' value={user.username} onChange={handleValueChange}/>
      </div>
      <div>
        密码：<input type="password" name="password" value={user.password} onChange={handleValueChange}/>
      </div>
      <div>
        <button onClick={handleLogin}>登陆</button>
      </div>
    </div>
  </>
}