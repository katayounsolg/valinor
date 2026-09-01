type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: InputProps) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        height: "54px",
        borderRadius: "16px",
        border: "1px solid #ddd",
        padding: "0 18px",
        fontSize: "16px",
        boxSizing: "border-box",
        ...(props.style || {}),
      }}
    />
  );
}