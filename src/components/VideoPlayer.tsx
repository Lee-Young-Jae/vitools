import { forwardRef } from "react";
import { Subtitle } from "./SubtitleForm";
import { Box } from "@chakra-ui/react";

interface VideoPlayerProps {
  src: string;
  subtitles: Subtitle[];
  currentTime: number;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, subtitles, currentTime }, ref) => {
    // 현재 시간에 해당하는 자막 찾기
    const currentSubtitles = subtitles.filter(
      (subtitle) =>
        currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
    );

    return (
      <Box position="relative" width="100%" maxWidth="800px" mx="auto">
        <video ref={ref} controls src={src} style={{ width: "100%" }}></video>
        {currentSubtitles.length
          ? currentSubtitles.map((currentSubtitle) => (
              <Box
                key={
                  currentSubtitle.startTime + currentSubtitle.text.slice(0, 5)
                }
                className="cookie-run"
                position="absolute"
                bottom={
                  currentSubtitle.position === "bottom"
                    ? "0%"
                    : currentSubtitle.position === "top"
                    ? "80%"
                    : "50%"
                }
                left="50%"
                transform="translate(-50%, -50%)"
                color={currentSubtitle.fontColor}
                fontSize={`${currentSubtitle.fontSize}px`}
                textAlign="center"
                whiteSpace="pre-wrap"
                px={2}
                bg="rgba(0, 0, 0, 0.5)"
              >
                {currentSubtitle.text}
              </Box>
            ))
          : null}
      </Box>
    );
  }
);

export default VideoPlayer;
