'use client'
import { useState } from "react"

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
    fetch('/login/api',{
      method:'POST',
      body:JSON.stringify(user),
      credentials:'same-origin'
    }).then(res=>res.json()).then(res=>{
      const {code,message}=res;
      //登陆成功
      if(code===0){
        const pathname= new URL(location.href).searchParams.get('pathname')
        location.href=location.origin+pathname
      }
      // 登陆失败
      if(code===-1){
        console.log(message)
      }
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