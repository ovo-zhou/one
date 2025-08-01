interface IProps {
  className?: string;
  children: React.ReactNode;
}
export default function H2(props: IProps) {
  const { className, children } = props;
  return (
    <h2
      className={`scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 ${className}`}
    >
      {children}
    </h2>
  );
}
