type CardProps = {
  children: React.ReactNode;
  width?: string;
};

export default function Card({
  children,
  width = "430px",
}: CardProps) {
  return (
    <div
      style={{
        width,
        background: "white",
        borderRadius: "32px",
        padding: "45px",
        boxShadow: "0 20px 60px rgba(0,0,0,.06)",
      }}
    >
      {children}
    </div>
  );
}