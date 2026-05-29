type StatusPillProps = {
  active: boolean;
  activeText: string;
  inactiveText: string;
};

export default function StatusPill({ active, activeText, inactiveText }: StatusPillProps) {
  return <span className={active ? 'status-pill status-pill-active' : 'status-pill'}>{active ? activeText : inactiveText}</span>;
}
