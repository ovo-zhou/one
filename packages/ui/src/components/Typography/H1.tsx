interface IProps{
  className?:string
  children:React.ReactNode
}
export default function H1(props:IProps) {
  const { children, className } = props;
  return (
    <h1 className={`scroll-m-20 text-4xl font-extrabold tracking-tight text-balance ${className}`}>
      {children}
    </h1>
  );
}
