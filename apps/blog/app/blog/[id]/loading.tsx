import { Loader } from 'lucide-react';
export default function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 pt-[40vh]">
      <Loader size={16} /> 加载中...
    </div>
  );
}
