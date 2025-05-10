"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const oauthLoginConfig = [
  {
    name: "github",
    btnText: "GitHub 授权登录",
    logo: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="currentColor"
        className="bi bi-github"
        viewBox="0 0 16 16"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
      </svg>
    ),
    authorizeUrl:
      "https://github.com/login/oauth/authorize?client_id=Ov23lip5jG5LIRef8yS4&redirect_uri=https://www.ryandev.cn/authorize?loginOrigin=github",
    disable: false,
  },
  {
    name: "gitee",
    btnText: "Gitee 授权登录",
    logo: (
      <svg
        fill="#ffffff"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296z"></path>
        </g>
      </svg>
    ),
    authorizeUrl:
      "https://gitee.com/oauth/authorize?client_id=18eaa7f6f8a42fbd51db9247533ed432a5218b38f29ac36e5ce30dd1c3af7215&redirect_uri=https://www.ryandev.cn/authorize?loginOrigin=gitee&response_type=code",
    disable: false,
  },
];
export default function Page() {
  const handleToGitHubAuthorize = (url) => {
    window.location.href = url;
  };
  return (
    <div
      className="flex justify-center items-center flex-col gap-6"
      style={{ height: "calc(100vh - 6rem)" }}
    >
      {oauthLoginConfig.map((item) => {
        if (item.disable) {
          return (
            <Popover key={item.name}>
              <PopoverTrigger>
                <div
                  key={item.name}
                  className="flex justify-start items-center gap-4 bg-black text-white px-4 py-2 rounded-md cursor-pointer min-w-[200px]"
                >
                  {item.logo}
                  <div>{item.btnText}</div>
                </div>
              </PopoverTrigger>
              <PopoverContent side="top">
                由于网络限制，GitHub 授权登录暂时不可用，请使用其他方式登录。
              </PopoverContent>
            </Popover>
          );
        } else {
          return (
            <div
              key={item.name}
              className="flex justify-start items-center gap-4 bg-black text-white px-4 py-2 rounded-md cursor-pointer min-w-[200px]"
              onClick={() => handleToGitHubAuthorize(item.authorizeUrl)}
            >
              {item.logo}
              <div>{item.btnText}</div>
            </div>
          );
        }
      })}
    </div>
  );
}
