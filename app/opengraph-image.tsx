import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#fafaf9",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "#be123c",
          borderRadius: 96,
          display: "flex",
          height: 360,
          justifyContent: "center",
          width: 360,
        }}
      >
        <svg
          height="260"
          viewBox="0 0 64 64"
          width="260"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 18h28a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4Zm4 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm10 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-20 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm20-12a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
            fill="#fff"
          />
        </svg>
      </div>
    </div>,
    size,
  );
}
