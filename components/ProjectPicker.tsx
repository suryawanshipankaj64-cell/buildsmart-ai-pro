'use client';

export default function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (!projects.length) {
    return <p className="text-sm text-signal-slate">Create a project first to use this module.</p>;
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
    >
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}
