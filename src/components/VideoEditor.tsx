import React, { useState, useEffect, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import {
  Box,
  Button,
  Heading,
  Input,
  Progress,
  List,
  ListItem,
  IconButton,
  Flex,
  Stack,
  Skeleton,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";

import SubtitleForm, { Subtitle } from "./SubtitleForm";
import VideoPlayer from "./VideoPlayer";

const VideoEditor = () => {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [outputVideo, setOutputVideo] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const [subtitleToEdit, setSubtitleToEdit] = useState<Subtitle | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [editingSubtitle, setEditingSubtitle] = useState<Subtitle>({
    text: "",
    startTime: 0,
    endTime: 0,
    fontSize: 24,
    fontColor: "#FFFFFF",
    position: "middle",
  });

  // SubtitleForm에서 입력 중인 자막 정보를 업데이트
  const handleSubtitleChange = (subtitle: Subtitle) => {
    setEditingSubtitle(subtitle);
  };

  // 전체 자막 목록 (편집 중인 자막 포함)
  const allSubtitles = subtitleToEdit
    ? subtitles
    : [...subtitles, editingSubtitle].filter(
        (subtitle) => subtitle.text.trim() !== ""
      );

  // 비디오 재생 시간 업데이트
  useEffect(() => {
    if (videoRef.current) {
      const handleTimeUpdate = () => {
        setCurrentTime(videoRef.current!.currentTime);
      };
      videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [videoSrc]);

  const handleEditSubtitle = (index: number) => {
    setSubtitleToEdit(subtitles[index]);
    setEditIndex(index);
  };

  const updateSubtitle = (updatedSubtitle: Subtitle) => {
    if (editIndex !== null) {
      const newSubtitles = [...subtitles];
      newSubtitles[editIndex] = updatedSubtitle;
      setSubtitles(newSubtitles);
      setSubtitleToEdit(null);
      setEditIndex(null);
    }
  };

  // toBlobURL 함수 정의
  const toBlobURL = async (url: string, mimeType: string): Promise<string> => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  // FFmpeg 로드
  const load = async () => {
    setLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ type, message }) => {
      console.log({ message, type });
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
    setLoaded(true);
    setLoading(false);
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoSrc(URL.createObjectURL(file));
    }
  };

  // 자막 삭제 함수
  const deleteSubtitle = (index: number) => {
    const newSubtitles = subtitles.filter((_, i) => i !== index);
    setSubtitles(newSubtitles);
  };

  const escapeText = (text: string): string => {
    return text.replace(/'/g, "\\'").replace(/:/g, "\\:");
  };

  const transcode = async () => {
    if (!ffmpegRef.current || !videoFile) return;
    setProcessing(true);
    const ffmpeg = ffmpegRef.current;

    try {
      // 영상 파일을 ffmpeg로 로드
      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));

      console.log("폰트 파일 로드");
      // 폰트 파일 로드
      await ffmpeg.writeFile(
        "CookieRunRegular.ttf",
        await fetchFile("/fonts/CookieRunRegular.ttf")
      );

      console.log("자막 합성");
      // drawtext 필터 명령어 생성
      const drawtextFilters = subtitles.map((subtitle) => {
        const { text, startTime, endTime, fontSize, fontColor, position } =
          subtitle;

        // 위치 설정
        let x = "(w-text_w)/2"; // 중앙 정렬
        let y =
          position === "top"
            ? "text_h"
            : position === "bottom"
            ? "h-text_h"
            : "(h-text_h)/2";

        // 색상 변환 (#RRGGBB -> 0xRRGGBB)
        const fontcolor = fontColor.replace("#", "0x");

        // 박스 배경 추가
        const boxOptions = ":box=1:boxcolor=black@0.5:boxborderw=5";

        return `drawtext=fontfile=CookieRunRegular.ttf:text='${escapeText(
          text
        )}':fontcolor=${fontcolor}:fontsize=${fontSize}:x=${x}:y=${y}:enable='between(t,${startTime},${endTime})'${boxOptions}`;
      });

      // 필터 연결
      const filterComplex = drawtextFilters.join(",");

      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-vf",
        filterComplex,
        "-c:a",
        "copy",
        "output.mp4",
      ]);

      console.log("결과물 추출");
      // 결과물 추출
      const data = await ffmpeg.readFile("output.mp4");
      console.log({ data });

      const blob = new Blob([data], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setOutputVideo(url);
    } catch (error) {
      console.error("FFmpeg 실행 중 오류 발생:", error);
      alert("영상 처리 중 오류가 발생했습니다.");
    }

    setProcessing(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          setVideoDuration(videoRef.current.duration);
          console.log("영상 길이:", videoRef.current.duration);
        }
      };
    }
  }, [videoSrc]);

  // 비디오 재생 시간 업데이트
  useEffect(() => {
    if (videoRef.current) {
      const handleTimeUpdate = () => {
        setCurrentTime(videoRef.current!.currentTime);
      };
      videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [videoSrc]);

  if (loading) {
    return (
      <Flex p={4}>
        <Stack w="300px" p={4} spacing={4}>
          <Skeleton height="40px" mb={8} />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="10px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="10px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="40px" width="120px" />
        </Stack>
        <Box flex="1" justifyContent="center" alignItems="center" mt={8}>
          <Skeleton height="400px" w="full" />
        </Box>
      </Flex>
    );
  }

  return (
    <Box p={4}>
      <Flex>
        {loaded && (
          <>
            {/* 사이드바 영역 */}
            <Box w="300px" mr={4}>
              <Heading mb={4}>영상 편집기</Heading>
              <Input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                mb={4}
              />

              {/* 자막 폼 */}
              <SubtitleForm
                onAddSubtitle={(subtitle) => {
                  setSubtitles([...subtitles, subtitle]);
                  setEditingSubtitle({
                    text: "",
                    startTime: 0,
                    endTime: 0,
                    fontSize: 24,
                    fontColor: "#FFFFFF",
                    position: "middle",
                  });
                }}
                subtitleToEdit={subtitleToEdit || undefined}
                onEditSubtitle={updateSubtitle}
                onChange={handleSubtitleChange} // 추가
                videoDuration={videoDuration}
                videoCurrentTime={currentTime} // 추가
              />

              {/* 자막 리스트 */}
              <List spacing={3}>
                {subtitles.map((subtitle, index) => (
                  <ListItem key={index} display="flex" alignItems="center">
                    <Box flex="1">
                      [{subtitle.startTime.toFixed(1)}s ~{" "}
                      {subtitle.endTime.toFixed(1)}s] {subtitle.text}
                    </Box>
                    <IconButton
                      aria-label="Edit subtitle"
                      icon={<EditIcon />}
                      size="sm"
                      mr={2}
                      onClick={() => handleEditSubtitle(index)}
                    />
                    <IconButton
                      aria-label="Delete subtitle"
                      icon={<DeleteIcon />}
                      size="sm"
                      onClick={() => deleteSubtitle(index)}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* 영상 및 미리보기 영역 */}
            <Box flex="1">
              {videoSrc && (
                <VideoPlayer
                  ref={videoRef}
                  src={videoSrc}
                  subtitles={allSubtitles}
                  currentTime={currentTime}
                />
              )}

              {outputVideo && (
                <Box mt={4}>
                  <Heading size="md" mb={2}>
                    처리된 영상
                  </Heading>
                  <Box
                    position="relative"
                    width="100%"
                    maxWidth="800px"
                    mx="auto"
                  >
                    <video
                      ref={videoRef}
                      controls
                      src={outputVideo}
                      width="100%"
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}
      </Flex>
      {outputVideo && (
        <Button
          as="a"
          href={outputVideo}
          download="output.mp4"
          mt={2}
          width="full"
        >
          결과 영상 다운로드
        </Button>
      )}
      {processing && <Progress size="xs" isIndeterminate mt={2} />}
      <Button
        colorScheme="blue"
        onClick={transcode}
        disabled={processing}
        mt={4}
        width="100%"
      >
        {processing ? "영상 처리 중..." : "영상 처리"}
      </Button>
    </Box>
  );
};

export default VideoEditor;
