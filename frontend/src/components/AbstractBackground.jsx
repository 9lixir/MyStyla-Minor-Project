// Ambient abstract-shape background — organic "color swatch" blobs that
// nod to MyStyla's palette-matching theme. Drop it as the first child of
// any relatively-positioned container and everything else should render
// on top (it's pointer-events: none and z-index: 0).
//
// Usage:
//   <div className="relative ...">
//     <AbstractBackground />
//     ...your real content...
//   </div>

export default function AbstractBackground({ variant = 'default' }) {
  const dense = variant === 'dense';

  return (
    <div className="mystyla-blob-field" aria-hidden="true">
      <svg
        className="mystyla-blob"
        style={{ top: '-8%', left: '-10%', width: '55%', maxWidth: 520 }}
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#FF6FB5"
          fillOpacity="0.28"
          d="M320,60 C370,110 380,190 340,250 C300,310 210,340 140,310 C70,280 30,200 60,130 C90,60 170,20 230,30 C260,35 290,30 320,60 Z"
        />
      </svg>

      <svg
        className="mystyla-blob mystyla-blob-slow mystyla-blob-reverse"
        style={{ bottom: '-12%', right: '-8%', width: '50%', maxWidth: 480 }}
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#C9B6FF"
          fillOpacity="0.22"
          d="M300,80 C350,140 360,220 310,280 C260,340 170,360 110,320 C50,280 20,200 60,140 C100,80 180,40 240,50 C260,53 270,60 300,80 Z"
        />
      </svg>

      <svg
        className="mystyla-blob mystyla-blob-slow"
        style={{ top: '30%', left: '55%', width: '30%', maxWidth: 300 }}
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#8FE3C0"
          fillOpacity="0.16"
          d="M230,60 C270,110 270,180 230,220 C190,260 120,270 80,230 C40,190 40,120 80,80 C120,40 190,20 230,60 Z"
        />
      </svg>

      {dense && (
        <svg
          className="mystyla-blob"
          style={{ top: '55%', left: '5%', width: '26%', maxWidth: 260 }}
          viewBox="0 0 300 300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#FFD166"
            fillOpacity="0.14"
            d="M220,70 C260,120 255,190 210,225 C165,260 100,255 70,210 C40,165 45,100 90,70 C135,40 190,30 220,70 Z"
          />
        </svg>
      )}
    </div>
  );
}
