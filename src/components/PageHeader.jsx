export default function PageHeader({ title, action }) {
  return (
    <div className="sticky top-0 z-40 bg-[#2d6a4f] px-5 py-5 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      {action}
    </div>
  );
}
