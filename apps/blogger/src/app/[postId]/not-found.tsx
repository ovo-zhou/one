import { Anchor, Box, Divider, Stack, Text, Title } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import classes from "../../components/ArticleLayout.module.css";
import brandClasses from "../../components/Brand.module.css";

export default function PostNotFound() {
  return (
    <main>
      <Box
        w={{ base: "100%", sm: 620, lg: 760 }}
        mx="auto"
        px={{ base: "md", sm: 0 }}
        py={{ base: "xl", sm: 72 }}
      >
        <Stack gap="xl">
          <Anchor
            href="/"
            underline="never"
            size="sm"
            c="dimmed"
            w="fit-content"
            className={classes.backLink}
            display="inline-flex"
            style={{ alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            返回首页
          </Anchor>

          <Box>
            <Title
              order={1}
              className={brandClasses.text}
              fz="clamp(30px, 5vw, 46px)"
              lts="-0.03em"
            >
              404 · NOT FOUND
            </Title>
            <Text c="dimmed" mt="md" lh={1.8}>
              这篇文章可能已被删除，或链接有误。不妨返回首页，看看其他内容。
            </Text>
          </Box>

          <Divider mod="brand" />

          <Box component="figure" m={0}>
            <Box component="figcaption" mb="lg">
              <Title order={2} fz="xl" fw={600}>
                沁园春·雪
              </Title>
              <Text size="sm" c="dimmed" mt="xs">
                毛泽东 · 一九三六年二月
              </Text>
            </Box>
            <Box
              component="blockquote"
              m={0}
              ff='"Songti SC", "Noto Serif SC", SimSun, serif'
              fz={{ base: "md", sm: "lg" }}
              lh={2}
            >
              <Text inherit style={{ whiteSpace: "pre-line" }}>
                {`北国风光，千里冰封，万里雪飘。
望长城内外，惟余莽莽；大河上下，顿失滔滔。
山舞银蛇，原驰蜡象，欲与天公试比高。
须晴日，看红装素裹，分外妖娆。`}
              </Text>
              <Text inherit mt="lg" style={{ whiteSpace: "pre-line" }}>
                {`江山如此多娇，引无数英雄竞折腰。
惜秦皇汉武，略输文采；唐宗宋祖，稍逊风骚。
一代天骄，成吉思汗，只识弯弓射大雕。
俱往矣，数风流人物，还看今朝。`}
              </Text>
            </Box>
          </Box>
        </Stack>
      </Box>
    </main>
  );
}
