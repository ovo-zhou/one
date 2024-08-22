// markdonwEditor 右键菜单配置
const config = [
  {
    name: "标题",
    children: [
      {
        name: "一级标题",
        value: "#",
      },
      {
        name: "二级标题",
        value: "##",
      },
      {
        name: "三级标题",
        value: "###",
      },
      {
        name: "四级标题",
        value: "####",
      },
      {
        name: "五级标题",
        value: "#####",
      },
      {
        name: "六级标题",
        value: "######",
      },
    ],
  },
  {
    name: "强调",
    children: [
      {
        name: "加粗",
        value: "**",
      },
      {
        name: "斜体",
        value: "*",
      },
    ],
  },
  {
    name: "引用",
    value: ">",
  },
  {
    name: "列表",
    children: [
      {
        name: "有序列表",
        value: "1.",
      },
      {
        name: "无序列表",
        value: "-",
      },
    ],
  },
];
