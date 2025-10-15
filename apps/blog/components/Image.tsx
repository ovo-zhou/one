import { Fullscreen } from "lucide-react";
interface IProps {
  src?: string | Blob;
  alt?: string;
}
export default function Image(props: IProps) {
  const { src, alt } = props;
  return (
    <>
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "auto",
        }}
      />
    </>
  );
}
