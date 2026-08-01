"use client";

import { useEffect, useState } from "react";
import { Title } from "@mantine/core";
import UserDropdown from "./UserDropdown";
import BlogNameLogin from "./BlogNameLogin";

interface User {
  name?: string;
  email?: string;
  isAdmin?: boolean;
}

export default function Greeting({ blogName }: { blogName: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user: User | null }) => {
        setUser(data.user);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <Title order={1}>
        你好，我是 <BlogNameLogin name={blogName} />
      </Title>
    );
  }

  if (user?.isAdmin) {
    return (
      <Title order={1}>
        你好，我是{" "}
        <a href="/admin" style={{ color: "inherit", textDecoration: "none" }}>
          {blogName}
        </a>
      </Title>
    );
  }

  if (user) {
    return (
      <Title order={1}>
        你好
        <UserDropdown name={user.name || user.email || ""} />
        ，我是 {blogName}
      </Title>
    );
  }

  return (
    <Title order={1}>
      你好，我是 <BlogNameLogin name={blogName} />
    </Title>
  );
}
