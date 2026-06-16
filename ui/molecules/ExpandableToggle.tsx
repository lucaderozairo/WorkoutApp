interface ExpandableToggleProps {
  id: string;
}

export function ExpandableToggle({ id }: ExpandableToggleProps) {
  return <input type="checkbox" id={id} className="exp-toggle" />;
}
