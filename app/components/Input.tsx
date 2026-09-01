type InputProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  type?: string;
};

export default function Input({
  value,
  placeholder,
  onChange,
  type = "text",
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        height: "56px",
        borderRadius: "16px",
        border: "1px solid #ddd",
        padding: "0 18px",
        fontSize: "16px",
        outline: "none",
      }}
    />
  );
}