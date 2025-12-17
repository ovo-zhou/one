import { Frown } from 'lucide-react';
export default function NotFound() {
  return (
    <div className="flex items-center justify-center pt-[40vh] text-red-500 gap-2">
      <Frown size={16} /> 资源不存在
    </div>
  );
}
