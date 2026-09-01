type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        height: "54px",
        padding: "0 28px",
        borderRadius: "16px",
        border: "none",
        background: "#C08F8F",
        color: "#fff",
        fontSize: "16px",
        cursor: "pointer",
        transition: ".3s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}