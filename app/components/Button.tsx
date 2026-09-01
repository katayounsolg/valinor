type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

export default function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        height: "56px",
        border: "none",
        borderRadius: "18px",
        cursor: "pointer",
        transition: ".25s",
        fontSize: "16px",

        background:
          variant === "primary"
            ? "var(--accent)"
            : "var(--soft)",

        color:
          variant === "primary"
            ? "#fff"
            : "var(--text)",
      }}
    >
      {children}
    </button>
  );
}