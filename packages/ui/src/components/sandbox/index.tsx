interface SandboxProps {
  htmlContent: string;
}
export default function Sandbox(props: SandboxProps) {
  const { htmlContent } = props;
  return (
    <iframe
      style={{ width: '100%', height: '100%' }}
      sandbox="allow-scripts"
      srcDoc={htmlContent}
    ></iframe>
  );
}
