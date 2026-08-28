export default function AbstractBackground({ variant = 'default' }) {
  const dense = variant === 'dense';
  const flowers = variant === 'flowers' || dense;

  return (
    <div className="mystyla-blob-field" aria-hidden="true">
      <svg
        className="mystyla-blob"
        style={{ top: '-12%', left: '-14%', width: '62%', maxWidth: 580 }}
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#F6DCCB"
          fillOpacity="0.72"
          d="M320,60 C370,110 380,190 340,250 C300,310 210,340 140,310 C70,280 30,200 60,130 C90,60 170,20 230,30 C260,35 290,30 320,60 Z"
        />
      </svg>

      <svg
        className="mystyla-blob mystyla-blob-slow mystyla-blob-reverse"
        style={{ bottom: '-16%', right: '-12%', width: '58%', maxWidth: 540 }}
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#D8C9E8"
          fillOpacity="0.65"
          d="M300,80 C350,140 360,220 310,280 C260,340 170,360 110,320 C50,280 20,200 60,140 C100,80 180,40 240,50 C260,53 270,60 300,80 Z"
        />
      </svg>

      <svg
        className="mystyla-blob mystyla-blob-slow"
        style={{ top: '26%', left: '52%', width: '36%', maxWidth: 340 }}
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#D9718A"
          fillOpacity="0.55"
          d="M230,60 C270,110 270,180 230,220 C190,260 120,270 80,230 C40,190 40,120 80,80 C120,40 190,20 230,60 Z"
        />
      </svg>

      {/* Extra accent blob -- gives the field a third point of visual weight
          even outside the dense/flowers variants, like a punchy color chip */}
      <svg
        className="mystyla-blob mystyla-blob-reverse"
        style={{ bottom: '6%', left: '-6%', width: '20%', maxWidth: 190 }}
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#D9718A"
          fillOpacity="0.4"
          d="M220,70 C260,120 255,190 210,225 C165,260 100,255 70,210 C40,165 45,100 90,70 C135,40 190,30 220,70 Z"
        />
      </svg>

      {/* Signature motif: a loose running stitch, referencing garment construction */}
      <svg
        className="mystyla-stitch"
        style={{ top: '18%', left: '8%', width: '38%', maxWidth: 360, opacity: 0.22 }}
        viewBox="0 0 360 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4,90 C60,10 120,10 180,60 C240,110 300,110 356,30"
          fill="none"
          stroke="#B5293F"
          strokeWidth="2"
          strokeDasharray="10 9"
          strokeLinecap="round"
        />
      </svg>

      {flowers && (
        <>
          <svg
            className="mystyla-blob"
            style={{ top: '8%', right: '10%', width: '10%', maxWidth: 52 }}
            viewBox="0 0 40 40"
          >
            <path
              fill="#D9718A"
              fillOpacity="0.65"
              d="M20 2 L23 15 L36 8 L25 18 L38 20 L25 22 L36 32 L23 25 L20 38 L17 25 L4 32 L15 22 L2 20 L15 18 L4 8 L17 15 Z"
            />
          </svg>
          <svg
            className="mystyla-blob mystyla-blob-reverse"
            style={{ bottom: '14%', left: '6%', width: '7%', maxWidth: 36 }}
            viewBox="0 0 40 40"
          >
            <path
              fill="#C17A3A"
              fillOpacity="0.55"
              d="M20 2 L23 15 L36 8 L25 18 L38 20 L25 22 L36 32 L23 25 L20 38 L17 25 L4 32 L15 22 L2 20 L15 18 L4 8 L17 15 Z"
            />
          </svg>
        </>
      )}

      {dense && (
        <svg
          className="mystyla-blob"
          style={{ top: '55%', left: '5%', width: '26%', maxWidth: 260 }}
          viewBox="0 0 300 300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#F6DCCB"
            fillOpacity="0.42"
            d="M220,70 C260,120 255,190 210,225 C165,260 100,255 70,210 C40,165 45,100 90,70 C135,40 190,30 220,70 Z"
          />
        </svg>
      )}
    </div>
  );
}