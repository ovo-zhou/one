"use client";

import { useEffect, useState } from "react";
import { Title, Anchor, Text } from "@mantine/core";
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

  const renderBlogName = () =>
    user?.isAdmin ? (
      <Anchor href="/admin" underline="never" className="brand-text" fz="inherit">
        {blogName}
      </Anchor>
    ) : (
      <BlogNameLogin name={blogName} />
    );

  if (!loaded || !user) {
    return (
      <Title order={1} ta="center" style={{ fontSize: "clamp(34px, 6vw, 56px)", letterSpacing: "-0.03em" }}>
        你好，我是 {renderBlogName()}
      </Title>
    );
  }

  if (user?.isAdmin) {
    return (
      <Title order={1} ta="center" style={{ fontSize: "clamp(34px, 6vw, 56px)", letterSpacing: "-0.03em" }}>
        你好，我是 {renderBlogName()}
      </Title>
    );
  }

  return (
    <Title order={1} ta="center" style={{ fontSize: "clamp(34px, 6vw, 56px)", letterSpacing: "-0.03em" }}>
      你好
      <UserDropdown name={user.name || user.email || ""} />
      ，我是 <Text component="span" className="brand-text" fz="inherit">{blogName}</Text>
    </Title>
  );
}
