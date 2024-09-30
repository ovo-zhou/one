export default function Modal(props) {
  const { children, title, open, onOk, onCancel } = props;
  if (!open) {
    return null;
  }
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-[rgba(0,0,0,0.7)] flex justify-center items-center">
      <div className="bg-white p-5 rounded-md w-[500px]">
        <div className="font-bold text-2xl leading-7">{title}</div>
        <div className="py-2">{children}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} type="button" className="border px-4 py-2 rounded-md text-sm hover:bg-gray-200">取消</button>
          <button onClick={onOk} type="button" className="border px-4 py-2 rounded-md text-sm bg-black text-white hover:bg-zinc-900">确认</button>
        </div>
      </div>
    </div>
  );
}
