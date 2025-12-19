import { useEffect, useRef } from 'react';
interface Props {
  children: React.ReactNode;
  messageLength?: number;
}

export default function ScrollBox({ children, messageLength }: Props) {
  const scrollBoxRef = useRef<HTMLDivElement>(null); // useRef
  const contentBoxRef = useRef<HTMLDivElement>(null);
  const anchorBoxRef = useRef<HTMLDivElement>(null);
  const isVisible = useRef(true);
  const messageLengthRef = useRef<number>(messageLength || 0);
  useEffect(() => {
    // 根据消息长度来判断是否是新消息
    if (messageLength !== messageLengthRef.current) {
      messageLengthRef.current = messageLength || 0;
      anchorBoxRef.current?.scrollIntoView();
    }
  }, [messageLength]);

  useEffect(() => {
    // 创建高度观察
    const resizeObserver = new ResizeObserver((entries) => {
      // 如果锚点在可见区域,或者没有流式输出但是高度变了，就滚动
      if (contentBoxRef.current && isVisible.current) {
        anchorBoxRef.current?.scrollIntoView();
      }
    });
    resizeObserver.observe(contentBoxRef.current!);
    // 然后再添加一个重叠观察者，观察锚点，如果锚点不在可见区域，就不滚动，如果锚点在可见区域，就滚动
    const anchorObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          isVisible.current = true;
        } else {
          isVisible.current = false;
        }
      },
      {
        root: scrollBoxRef.current,
        rootMargin: '0px',
        threshold: 0.6,
      }
    );
    anchorObserver.observe(anchorBoxRef.current!);
    return () => {
      resizeObserver.disconnect();
      anchorObserver.disconnect();
    };
  }, []);
  return (
    <div
      className="flex flex-col items-center overflow-y-scroll flex-1"
      style={{ scrollbarWidth: 'none' }}
    >
      <div ref={contentBoxRef} className="w-3xl px-2">
        {children}
      </div>
      <div ref={anchorBoxRef} className="w-full shrink-0 h-5"></div>
    </div>
  );
}
