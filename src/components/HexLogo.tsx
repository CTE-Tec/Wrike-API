export default function HexLogo({ size = 26 }: { size?: number }) {
  const h = (size / 26) * 30;
  return (
    <svg width={size} height={h} viewBox="0 0 100 116" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,4 50,58 7,31" fill="#004d6d" />
      <polygon points="50,4 93,31 50,58" fill="#008b95" />
      <polygon points="7,31 50,58 7,85" fill="#68bd4c" />
      <polygon points="93,31 93,85 50,58" fill="#f15a29" />
      <polygon points="7,85 50,58 50,112" fill="#be1e2d" />
      <polygon points="50,58 93,85 50,112" fill="#a34c9d" />
    </svg>
  );
}
