interface SandboxProps {
  htmlContent: string;
}
export default function Sandbox(props: SandboxProps) {
  const { htmlContent } = props;
  return (
    <iframe
      style={{ width: '300px', height: '300px' }}
      sandbox="allow-scripts"
      srcDoc={htmlContent}
    ></iframe>
  );
}
