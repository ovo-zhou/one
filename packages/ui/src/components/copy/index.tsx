import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
interface IProps {
  text: string;
}
export default function CopyIcon(props: IProps) {
  const { text } = props;
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };
  return !isCopied ? (
    <Copy size={18} className="cursor-pointer" onClick={handleCopy} />
  ) : (
    <Check size={18} className="cursor-pointer" />
  );
}
