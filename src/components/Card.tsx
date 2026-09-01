type CardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export default function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "28px",
        boxShadow: "0 12px 35px rgba(0,0,0,.05)",
        padding: "24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}