"use client";

type Props = {
  label?: string;
  className?: string;
};

export default function PrintPageButton({
  label = "طباعة الملصقات",
  className = "btn",
}: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
