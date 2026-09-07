import React, { useContext } from "react";

import { EmailRenderContext } from "../context";
import { getOrRenderPng, PngTextOptions } from "../pngText";

export interface PngTextProps extends PngTextOptions {
  text: string;
}

export default function PngText({
  text,
  font = "anta",
  fontSize = 40,
  color = "#ffffff",
  padding = 4,
  className,
}: PngTextProps) {
  const { isSending, addAttachment } = useContext(EmailRenderContext);
  const options = { font, fontSize, color, padding };
  const { buffer, width, height, dataUri } = getOrRenderPng(text, options);

  const imgStyle: React.CSSProperties = {
    display: "inline-block",
    verticalAlign: "middle",
    maxWidth: "100%",
    height: "auto",
    border: 0,
  };

  if (isSending) {
    const cid = addAttachment({
      content: buffer,
      contentType: "image/png",
    });
    return (
      <img
        src={`cid:${cid}`}
        alt={text}
        width={width}
        height={height}
        className={className}
        style={imgStyle}
      />
    );
  }

  return (
    <img
      src={dataUri}
      alt={text}
      width={width}
      height={height}
      className={className}
      style={imgStyle}
    />
  );
}
